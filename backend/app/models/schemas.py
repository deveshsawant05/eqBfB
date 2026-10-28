from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ForecastPoint(BaseModel):
    startTime: str
    settlementPeriod: int
    forecastMW: float
    publishTime: str  # latest publish time used (ISO string)


class ActualPoint(BaseModel):
    startTime: str
    settlementPeriod: int
    actualMW: float


class PeriodAccuracy(BaseModel):
    period: int
    mae: float
    bias: float
    rmse: float


class DailySummary(BaseModel):
    date: str
    mae: float
    rmse: float
    mape: float
    bias: float


class TimeSeriesPoint(BaseModel):
    startTime: str
    actualMW: float
    forecastMW: float
    error: float


class AccuracyMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    bias: float
    n_points: int
    error_by_period: list[PeriodAccuracy]
    daily_summary: list[DailySummary]
    time_series: list[TimeSeriesPoint]
