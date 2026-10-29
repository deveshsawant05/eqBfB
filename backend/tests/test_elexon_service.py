import pytest
import pandas as pd
from datetime import datetime, timezone
from unittest.mock import patch, AsyncMock
from app.services.elexon_service import ElexonService
from app.services.metrics_service import MetricsService


@pytest.mark.asyncio
async def test_parse_actuals_filters_wind():
    """Ensure FUELHH parser retains only WIND generation records."""
    svc = ElexonService()
    records = [
        {
            "startTime": "2026-01-15T00:00:00Z",
            "settlementPeriod": 1,
            "fuelType": "WIND",
            "generation": 4500,
        },
        {
            "startTime": "2026-01-15T00:00:00Z",
            "settlementPeriod": 1,
            "fuelType": "CCGT",
            "generation": 8200,
        },
        {
            "startTime": "2026-01-15T00:30:00Z",
            "settlementPeriod": 2,
            "fuelType": "WIND",
            "generation": 4800,
        },
    ]

    df = svc._parse_actuals(records)
    assert len(df) == 2
    assert list(df["actualMW"]) == [4500, 4800]
    assert list(df["settlementPeriod"]) == [1, 2]


@pytest.mark.asyncio
async def test_parse_forecasts_picks_latest_before_gate():
    """Ensure WINDFOR parser selects the latest forecast published before D-1 12:00 UTC."""
    svc = ElexonService()
    delivery_dt = datetime(2026, 1, 15, tzinfo=timezone.utc)
    gate_closure = datetime(2026, 1, 14, 12, 0, 0, tzinfo=timezone.utc)

    records = [
        # Earlier forecast run (D-1 08:30 UTC) - valid but superseded
        {
            "startTime": "2026-01-15T00:00:00Z",
            "publishTime": "2026-01-14T08:30:00Z",
            "settlementPeriod": 1,
            "generation": 5000,
        },
        # Latest forecast run before gate closure (D-1 10:30 UTC) - should be chosen
        {
            "startTime": "2026-01-15T00:00:00Z",
            "publishTime": "2026-01-14T10:30:00Z",
            "settlementPeriod": 1,
            "generation": 5200,
        },
        # Forecast run after gate closure (D-1 12:30 UTC) - must be excluded
        {
            "startTime": "2026-01-15T00:00:00Z",
            "publishTime": "2026-01-14T12:30:00Z",
            "settlementPeriod": 1,
            "generation": 5500,
        },
    ]

    df = svc._parse_forecasts(records, delivery_dt, gate_closure)
    # The hourly forecast at 00:00 expands to both SP 1 (00:00) and SP 2 (00:30)
    assert len(df) == 2
    assert list(df["forecastMW"]) == [5200, 5200]
    assert list(df["settlementPeriod"]) == [1, 2]
    assert "2026-01-14T10:30:00Z" in df.iloc[0]["publishTime"]


@pytest.mark.asyncio
async def test_metrics_service_computation():
    """Verify metrics calculation (MAE, RMSE, MAPE, bias) with synthetic data."""
    metrics_svc = MetricsService()

    mock_actuals = pd.DataFrame([
        {"startTime": pd.Timestamp("2026-01-15T00:00:00Z"), "settlementPeriod": 1, "actualMW": 1000.0},
        {"startTime": pd.Timestamp("2026-01-15T00:30:00Z"), "settlementPeriod": 2, "actualMW": 2000.0},
    ])

    mock_forecasts = pd.DataFrame([
        {"startTime": pd.Timestamp("2026-01-15T00:00:00Z"), "settlementPeriod": 1, "forecastMW": 1100.0, "publishTime": "2026-01-14T10:30:00Z"},
        {"startTime": pd.Timestamp("2026-01-15T00:30:00Z"), "settlementPeriod": 2, "forecastMW": 1900.0, "publishTime": "2026-01-14T10:30:00Z"},
    ])

    with patch.object(metrics_svc.elexon, "get_all_actuals_jan2026", AsyncMock(return_value=mock_actuals)), \
         patch.object(metrics_svc.elexon, "get_all_forecasts_jan2026", AsyncMock(return_value=mock_forecasts)):
        res = await metrics_svc.compute_accuracy()

        assert res["n_points"] == 2
        # Error 1: 1100 - 1000 = +100
        # Error 2: 1900 - 2000 = -100
        # MAE = (100 + 100) / 2 = 100
        assert res["mae"] == 100.0
        # Bias = (+100 - 100) / 2 = 0
        assert res["bias"] == 0.0
        # RMSE = sqrt((100^2 + 100^2)/2) = 100
        assert res["rmse"] == 100.0
