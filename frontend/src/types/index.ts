export interface ForecastPoint {
  startTime: string;
  settlementPeriod: number;
  forecastMW: number;
  publishTime: string;
}

export interface ActualPoint {
  startTime: string;
  settlementPeriod: number;
  actualMW: number;
}

/** Merged actuals + forecast for chart display */
export interface ChartPoint {
  startTime: string;
  settlementPeriod: number;
  label: string;          // formatted as "HH:MM"
  forecastMW?: number;
  actualMW?: number;
  publishTime?: string;
}

export interface PeriodAccuracy {
  period: number;
  mae: number;
  bias: number;
  rmse: number;
}

export interface DailySummary {
  date: string;
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
}

export interface TimeSeriesPoint {
  startTime: string;
  actualMW: number;
  forecastMW: number;
  error: number;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  n_points: number;
  error_by_period: PeriodAccuracy[];
  daily_summary: DailySummary[];
  time_series: TimeSeriesPoint[];
  error?: string;
}
