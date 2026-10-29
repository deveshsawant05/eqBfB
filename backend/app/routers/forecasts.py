from fastapi import APIRouter, HTTPException, Query
from app.services.elexon_service import ElexonService
import pandas as pd
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
_svc = ElexonService()

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
JAN2026_START = "2026-01-01"
JAN2026_END = "2026-01-31"


def _validate_date(date: str):
    if not DATE_RE.match(date):
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    if not (JAN2026_START <= date <= JAN2026_END):
        raise HTTPException(
            status_code=400,
            detail=f"date must be within January 2026 ({JAN2026_START} to {JAN2026_END})"
        )


@router.get("/forecasts", summary="Day-ahead wind generation forecast")
async def get_forecasts(
    date: str = Query(..., description="Delivery date in YYYY-MM-DD format (January 2026 only)")
):
    """
    Returns the latest day-ahead wind generation forecast for each settlement period
    of the given delivery date. 'Latest' means the most recent WINDFOR record
    published before D-1 12:00 UTC (gate closure proxy).

    Each point includes the forecastMW and the publishTime of the forecast used.
    """
    _validate_date(date)
    try:
        df = await _svc.get_forecasts(date)
    except Exception as e:
        logger.error(f"Error fetching forecasts for {date}: {e}")
        raise HTTPException(status_code=502, detail=f"Upstream Elexon API error: {str(e)}")

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No forecast data found for {date}. "
                   "This may mean no WINDFOR records were published before the gate closure for this date."
        )
    return df.to_dict(orient="records")


@router.get("/actuals", summary="Wind generation actuals")
async def get_actuals(
    date: str = Query(..., description="Settlement date in YYYY-MM-DD format (January 2026 only)")
):
    """
    Returns the actual wind generation outturn (FUELHH, fuelType=WIND)
    for each settlement period of the given date.
    """
    _validate_date(date)
    try:
        df = await _svc.get_actuals(date)
    except Exception as e:
        logger.error(f"Error fetching actuals for {date}: {e}")
        raise HTTPException(status_code=502, detail=f"Upstream Elexon API error: {str(e)}")

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No actuals data found for {date}. Data may not yet be published for this date."
        )

    # Serialize datetimes to strings
    df = df.copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True).dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    return df.to_dict(orient="records")
