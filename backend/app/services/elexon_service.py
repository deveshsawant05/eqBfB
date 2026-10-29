"""
ElexonService — fetches and caches wind data from the Elexon BMRS Insights API.

Key facts confirmed from live API research:
- Base URL: https://data.elexon.co.uk/bmrs/api/v1
- No authentication required (public API)
- FUELHH stream: requires settlementDateFrom / settlementDateTo, fuelType=WIND
  (Note: 'settlementDate' alone is ignored by the stream endpoint and defaults to today)
  - Returns array with fields: 'settlementDate', 'settlementPeriod', 'fuelType', 'generation' (MW)
- WINDFOR stream: requires publishDateTimeFrom / publishDateTimeTo (ISO 8601 UTC)
  - Returns array with fields: 'publishTime', 'startTime', 'generation' (MW)
- Gate closure proxy: D-1 12:00 UTC -> last available forecast run is the 10:30 UTC or 11:30 UTC run on D-1
- Day-ahead wind forecasts are published at hourly resolution; in the UK market, each hourly
  forecast applies across both half-hour settlement periods (SP 2H-1 and 2H).
  Expanding hourly forecasts to half-hourly ensures 1-to-1 alignment with FUELHH actuals (48 SPs/day).
"""

import httpx
import pandas as pd
from datetime import datetime, timedelta, timezone
from cachetools import TTLCache
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_cache: TTLCache = TTLCache(maxsize=256, ttl=settings.CACHE_TTL_SECONDS)

ELEXON_BASE = settings.ELEXON_BASE_URL


class ElexonService:
    """Async service for fetching wind generation data from Elexon BMRS API."""

    async def _get(self, path: str, params: dict) -> list[dict]:
        """Make an async GET request to Elexon API. Returns list of records."""
        url = f"{ELEXON_BASE}{path}"
        final_params = {**params, "format": "json"}
        logger.info(f"Fetching {url} params={final_params}")
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
            resp = await client.get(url, params=final_params)
            resp.raise_for_status()
            data = resp.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("data", [])
        return []

    # -------------------------------------------------------------------------
    # Actuals (FUELHH)
    # -------------------------------------------------------------------------

    async def get_actuals(self, date: str) -> pd.DataFrame:
        """
        Fetch FUELHH wind actuals for a single settlement date.
        date: 'YYYY-MM-DD'
        Returns DataFrame: startTime, settlementPeriod, actualMW
        """
        cache_key = f"actuals_{date}"
        if cache_key in _cache:
            return _cache[cache_key]

        # Use settlementDateFrom & settlementDateTo because settlementDate alone
        # defaults to the current day in Elexon's stream endpoint.
        records = await self._get(
            "/datasets/FUELHH/stream",
            {
                "settlementDateFrom": date,
                "settlementDateTo": date,
                "fuelType": "WIND",
            },
        )

        df = self._parse_actuals(records)
        _cache[cache_key] = df
        return df

    async def get_all_actuals_jan2026(self) -> pd.DataFrame:
        """Fetch all FUELHH wind actuals for January 2026."""
        cache_key = "all_actuals_jan2026"
        if cache_key in _cache:
            return _cache[cache_key]

        records = await self._get(
            "/datasets/FUELHH/stream",
            {
                "settlementDateFrom": "2026-01-01",
                "settlementDateTo": "2026-01-31",
                "fuelType": "WIND",
            },
        )

        df = self._parse_actuals(records)
        _cache[cache_key] = df
        return df

    def _parse_actuals(self, records: list[dict]) -> pd.DataFrame:
        """Parse raw FUELHH records into a clean DataFrame."""
        wind = [r for r in records if r.get("fuelType", "").upper() == "WIND"]
        if not wind:
            return pd.DataFrame(columns=["startTime", "settlementPeriod", "actualMW"])

        df = pd.DataFrame(wind)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df = df.rename(columns={"generation": "actualMW"})

        if "settlementPeriod" in df.columns:
            df["settlementPeriod"] = df["settlementPeriod"].astype(int)

        # Deduplicate and sort
        df = df[["startTime", "settlementPeriod", "actualMW"]].drop_duplicates("settlementPeriod")
        df = df.sort_values("settlementPeriod").reset_index(drop=True)
        return df

    # -------------------------------------------------------------------------
    # Forecasts (WINDFOR)
    # -------------------------------------------------------------------------

    async def get_forecasts(self, delivery_date: str) -> pd.DataFrame:
        """
        Fetch day-ahead wind forecasts for a given delivery date.
        Returns the LATEST WINDFOR record published before D-1 12:00 UTC
        for each settlement period of delivery_date.

        delivery_date: 'YYYY-MM-DD'
        Returns DataFrame: startTime, settlementPeriod, forecastMW, publishTime
        """
        cache_key = f"forecasts_{delivery_date}"
        if cache_key in _cache:
            return _cache[cache_key]

        delivery_dt = datetime.strptime(delivery_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        d_minus_1 = delivery_dt - timedelta(days=1)
        gate_closure = d_minus_1.replace(hour=settings.GATE_CLOSURE_HOUR, minute=0, second=0, microsecond=0)

        # Fetch forecasts published from D-2 00:00 to gate closure D-1 12:00
        pub_from = (d_minus_1 - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")
        pub_to = gate_closure.strftime("%Y-%m-%dT%H:%M:%SZ")

        records = await self._get(
            "/datasets/WINDFOR/stream",
            {"publishDateTimeFrom": pub_from, "publishDateTimeTo": pub_to},
        )

        df = self._parse_forecasts(records, delivery_dt, gate_closure)
        _cache[cache_key] = df
        return df

    async def get_all_forecasts_jan2026(self) -> pd.DataFrame:
        """
        For every delivery day in Jan 2026, fetch the latest WINDFOR forecast
        published before D-1 12:00 UTC gate closure, expanded to half-hourly resolution.
        """
        cache_key = "all_forecasts_jan2026"
        if cache_key in _cache:
            return _cache[cache_key]

        # Query forecasts published in Dec 2025 + Jan 2026
        records = await self._get(
            "/datasets/WINDFOR/stream",
            {
                "publishDateTimeFrom": "2025-12-01T00:00:00Z",
                "publishDateTimeTo": "2026-01-31T23:59:59Z",
            },
        )

        df_raw = pd.DataFrame(records) if records else pd.DataFrame()
        if df_raw.empty:
            return pd.DataFrame(columns=["startTime", "settlementPeriod", "forecastMW", "publishTime"])

        df_raw["startTime"] = pd.to_datetime(df_raw["startTime"], utc=True)
        df_raw["publishTime"] = pd.to_datetime(df_raw["publishTime"], utc=True)

        # Keep only forecasts targeting January 2026 delivery
        jan_start = pd.Timestamp("2026-01-01", tz="UTC")
        jan_end = pd.Timestamp("2026-02-01", tz="UTC")
        df_raw = df_raw[(df_raw["startTime"] >= jan_start) & (df_raw["startTime"] < jan_end)].copy()

        # Gate closure for each delivery day: delivery date midnight UTC minus 12 hours (D-1 12:00 UTC)
        df_raw["deliveryMidnight"] = df_raw["startTime"].dt.normalize()
        df_raw["gateClosureTime"] = df_raw["deliveryMidnight"] - pd.Timedelta(hours=12)
        df_raw = df_raw[df_raw["publishTime"] <= df_raw["gateClosureTime"]].copy()

        if df_raw.empty:
            return pd.DataFrame(columns=["startTime", "settlementPeriod", "forecastMW", "publishTime"])

        # Normalize generation column
        gen_col = "generation" if "generation" in df_raw.columns else (
            "forecastVolume" if "forecastVolume" in df_raw.columns else None)
        if gen_col:
            df_raw = df_raw.rename(columns={gen_col: "forecastMW"})

        # Pick latest publishTime per startTime
        df = (
            df_raw.sort_values("publishTime")
            .groupby("startTime", as_index=False)
            .last()
        )

        # Expand hourly forecasts to half-hourly
        expanded = []
        for _, row in df.iterrows():
            st = row["startTime"]
            midnight = st.normalize()
            sp1 = int((st - midnight).total_seconds() // 1800) + 1
            r1 = row.to_dict()
            r1["settlementPeriod"] = sp1
            r1["startTime"] = st
            expanded.append(r1)

            if st.minute == 0 and sp1 < 48:
                r2 = row.to_dict()
                r2["settlementPeriod"] = sp1 + 1
                r2["startTime"] = st + pd.Timedelta(minutes=30)
                expanded.append(r2)

        df_res = pd.DataFrame(expanded).drop_duplicates(["startTime", "settlementPeriod"])
        df_res = df_res[["startTime", "settlementPeriod", "forecastMW", "publishTime"]].sort_values("startTime").reset_index(drop=True)

        _cache[cache_key] = df_res
        return df_res

    def _parse_forecasts(
        self,
        records: list[dict],
        delivery_dt: datetime,
        gate_closure: datetime,
    ) -> pd.DataFrame:
        """Parse raw WINDFOR records: filter for delivery_dt, apply gate closure, pick latest, expand to 48 SPs."""
        if not records:
            return pd.DataFrame(columns=["startTime", "settlementPeriod", "forecastMW", "publishTime"])

        df = pd.DataFrame(records)
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)

        # Filter to records whose startTime falls on the delivery date
        delivery_date_ts = pd.Timestamp(delivery_dt)
        df = df[df["startTime"].dt.date == delivery_date_ts.date()].copy()

        # Apply gate closure cutoff
        gate_ts = pd.Timestamp(gate_closure)
        df = df[df["publishTime"] <= gate_ts].copy()

        if df.empty:
            return pd.DataFrame(columns=["startTime", "settlementPeriod", "forecastMW", "publishTime"])

        gen_col = "generation" if "generation" in df.columns else (
            "forecastVolume" if "forecastVolume" in df.columns else None)
        if gen_col:
            df = df.rename(columns={gen_col: "forecastMW"})

        # Pick latest publishTime per startTime
        df = (
            df.sort_values("publishTime")
            .groupby("startTime", as_index=False)
            .last()
        )

        # Expand hourly forecasts to half-hourly settlement periods
        delivery_midnight = pd.Timestamp(delivery_dt).normalize()
        expanded = []
        for _, row in df.iterrows():
            st = row["startTime"]
            sp1 = int((st - delivery_midnight).total_seconds() // 1800) + 1
            r1 = row.to_dict()
            r1["settlementPeriod"] = sp1
            r1["startTime"] = st.strftime("%Y-%m-%dT%H:%M:%SZ")
            r1["publishTime"] = row["publishTime"].strftime("%Y-%m-%dT%H:%M:%SZ")
            expanded.append(r1)

            # If hourly record, also populate the second half-hour
            if st.minute == 0 and sp1 < 48:
                r2 = row.to_dict()
                r2["settlementPeriod"] = sp1 + 1
                r2["startTime"] = (st + pd.Timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
                r2["publishTime"] = row["publishTime"].strftime("%Y-%m-%dT%H:%M:%SZ")
                expanded.append(r2)

        df_out = (
            pd.DataFrame(expanded)
            .drop_duplicates("settlementPeriod")
            .sort_values("settlementPeriod")
            .reset_index(drop=True)
        )
        return df_out[["startTime", "settlementPeriod", "forecastMW", "publishTime"]]
