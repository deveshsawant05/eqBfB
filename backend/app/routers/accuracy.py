from fastapi import APIRouter, HTTPException
from app.services.metrics_service import MetricsService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
_svc = MetricsService()


@router.get("/accuracy", summary="Forecast accuracy metrics for January 2026")
async def get_accuracy():
    """
    Computes and returns wind generation forecast accuracy metrics for January 2026:

    - **MAE** (Mean Absolute Error in MW): average magnitude of forecast error
    - **RMSE** (Root Mean Squared Error in MW): penalizes large errors more
    - **MAPE** (Mean Absolute Percentage Error %): normalized error metric
    - **Bias** (Mean signed error in MW): positive = systematic over-forecast

    Also returns:
    - `error_by_period`: MAE and bias broken down by each of the 48 settlement periods
    - `daily_summary`: MAE, RMSE, MAPE, bias for each day in January 2026
    - `time_series`: full list of actual vs forecast values with error for charting

    Note: This endpoint fetches ~6 weeks of Elexon data and may take 10-30 seconds
    on first call. Subsequent calls use a 30-minute cache.
    """
    try:
        result = await _svc.compute_accuracy()
    except Exception as e:
        logger.error(f"Error computing accuracy: {e}")
        raise HTTPException(status_code=502, detail=f"Error computing accuracy: {str(e)}")

    if result.get("n_points", 0) == 0:
        raise HTTPException(
            status_code=404,
            detail=result.get("error", "No matched data found for January 2026")
        )
    return result
