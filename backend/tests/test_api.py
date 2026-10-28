import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import pandas as pd
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


def test_invalid_date_format():
    res = client.get("/api/forecasts?date=invalid-date")
    assert res.status_code == 400
    assert "YYYY-MM-DD" in res.json()["detail"]


def test_date_out_of_january_2026_scope():
    res = client.get("/api/forecasts?date=2025-12-31")
    assert res.status_code == 400
    assert "January 2026" in res.json()["detail"]


def test_forecasts_endpoint_success():
    mock_df = pd.DataFrame([
        {
            "startTime": "2026-01-15T00:00:00Z",
            "settlementPeriod": 1,
            "forecastMW": 5200.0,
            "publishTime": "2026-01-14T10:30:00Z",
        }
    ])
    with patch("app.routers.forecasts._svc.get_forecasts", AsyncMock(return_value=mock_df)):
        res = client.get("/api/forecasts?date=2026-01-15")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["forecastMW"] == 5200.0
        assert data[0]["settlementPeriod"] == 1


def test_actuals_endpoint_success():
    mock_df = pd.DataFrame([
        {
            "startTime": "2026-01-15T00:00:00Z",
            "settlementPeriod": 1,
            "actualMW": 4900.0,
        }
    ])
    with patch("app.routers.forecasts._svc.get_actuals", AsyncMock(return_value=mock_df)):
        res = client.get("/api/actuals?date=2026-01-15")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["actualMW"] == 4900.0


def test_accuracy_endpoint_success():
    mock_metrics = {
        "mae": 150.2,
        "rmse": 180.5,
        "mape": 8.5,
        "bias": 25.1,
        "n_points": 1488,
        "error_by_period": [],
        "daily_summary": [],
        "time_series": [],
    }
    with patch("app.routers.accuracy._svc.compute_accuracy", AsyncMock(return_value=mock_metrics)):
        res = client.get("/api/accuracy")
        assert res.status_code == 200
        data = res.json()
        assert data["mae"] == 150.2
        assert data["n_points"] == 1488
