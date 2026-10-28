"""
MetricsService — computes forecast accuracy statistics for January 2026.

Metrics computed:
- MAE  (Mean Absolute Error) in MW
- RMSE (Root Mean Squared Error) in MW
- MAPE (Mean Absolute Percentage Error) in %
- Bias (Mean signed error; positive = over-forecast) in MW
- Per-settlement-period breakdown (48 periods)
- Per-day breakdown (31 days)
- Full time-series of forecast vs actual + error
"""

import numpy as np
import pandas as pd
from app.services.elexon_service import ElexonService
import logging

logger = logging.getLogger(__name__)


class MetricsService:
    def __init__(self):
        self.elexon = ElexonService()

    async def compute_accuracy(self) -> dict:
        """Compute forecast accuracy metrics for January 2026."""
        logger.info("Computing accuracy metrics for January 2026...")

        actuals_df = await self.elexon.get_all_actuals_jan2026()
        forecasts_df = await self.elexon.get_all_forecasts_jan2026()

        if actuals_df.empty or forecasts_df.empty:
            logger.warning("Empty data returned from Elexon API")
            return {
                "mae": 0.0, "rmse": 0.0, "mape": 0.0, "bias": 0.0,
                "n_points": 0,
                "error_by_period": [], "daily_summary": [], "time_series": [],
                "error": "No data available for January 2026",
            }

        # Parse datetime columns if still strings
        if actuals_df["startTime"].dtype == object:
            actuals_df["startTime"] = pd.to_datetime(actuals_df["startTime"], utc=True)
        if forecasts_df["startTime"].dtype == object:
            forecasts_df["startTime"] = pd.to_datetime(forecasts_df["startTime"], utc=True)

        # Merge on startTime
        merged = pd.merge(
            actuals_df[["startTime", "settlementPeriod", "actualMW"]],
            forecasts_df[["startTime", "forecastMW"]],
            on="startTime",
            how="inner",
        )

        if merged.empty:
            return {
                "mae": 0.0, "rmse": 0.0, "mape": 0.0, "bias": 0.0,
                "n_points": 0,
                "error_by_period": [], "daily_summary": [], "time_series": [],
                "error": "No matching actuals+forecasts for January 2026",
            }

        # Core error columns
        merged["error"] = merged["forecastMW"] - merged["actualMW"]
        merged["abs_error"] = merged["error"].abs()
        merged["sq_error"] = merged["error"] ** 2
        # Clip denominator at 1 MW to avoid division-by-zero on near-zero actual wind
        merged["pct_error"] = (merged["abs_error"] / merged["actualMW"].clip(lower=1.0)) * 100.0

        # ── Overall metrics ──────────────────────────────────────────────────
        mae = float(merged["abs_error"].mean())
        rmse = float(np.sqrt(merged["sq_error"].mean()))
        mape = float(merged["pct_error"].mean())
        bias = float(merged["error"].mean())
        n = len(merged)

        # ── Per settlement period (1–48) ─────────────────────────────────────
        by_period = (
            merged.groupby("settlementPeriod", as_index=False)
            .agg(
                mae=("abs_error", "mean"),
                bias=("error", "mean"),
                rmse=("sq_error", lambda x: float(np.sqrt(x.mean()))),
            )
            .rename(columns={"settlementPeriod": "period"})
        )
        by_period["mae"] = by_period["mae"].round(2)
        by_period["bias"] = by_period["bias"].round(2)
        by_period["rmse"] = by_period["rmse"].round(2)
        by_period_list = by_period.to_dict(orient="records")

        # ── Per day ──────────────────────────────────────────────────────────
        merged["date"] = merged["startTime"].dt.date.astype(str)
        daily = (
            merged.groupby("date", as_index=False)
            .agg(
                mae=("abs_error", "mean"),
                rmse=("sq_error", lambda x: float(np.sqrt(x.mean()))),
                mape=("pct_error", "mean"),
                bias=("error", "mean"),
            )
        )
        daily["mae"] = daily["mae"].round(2)
        daily["rmse"] = daily["rmse"].round(2)
        daily["mape"] = daily["mape"].round(2)
        daily["bias"] = daily["bias"].round(2)
        daily_list = daily.to_dict(orient="records")

        # ── Time series ──────────────────────────────────────────────────────
        ts = merged[["startTime", "actualMW", "forecastMW", "error"]].copy()
        ts["startTime"] = ts["startTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        ts["actualMW"] = ts["actualMW"].round(1)
        ts["forecastMW"] = ts["forecastMW"].round(1)
        ts["error"] = ts["error"].round(1)
        ts_list = ts.to_dict(orient="records")

        return {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "bias": round(bias, 2),
            "n_points": n,
            "error_by_period": by_period_list,
            "daily_summary": daily_list,
            "time_series": ts_list,
        }
