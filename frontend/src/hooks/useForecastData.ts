import { useState, useEffect } from 'react';
import { fetchForecasts, fetchActuals } from '../api/client';
import type { ChartPoint } from '../types';
import { format } from 'date-fns';

/** Formats settlement period number to HH:MM string */
function periodToLabel(sp: number): string {
  const totalMinutes = (sp - 1) * 30;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface UseForecastDataResult {
  data: ChartPoint[];
  loading: boolean;
  error: string | null;
  forecastPublishTime: string | null;  // the publish time of the forecast used
}

export function useForecastData(date: Date): UseForecastDataResult {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastPublishTime, setForecastPublishTime] = useState<string | null>(null);

  useEffect(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setLoading(true);
    setError(null);
    setData([]);
    setForecastPublishTime(null);

    Promise.all([
      fetchForecasts(dateStr).catch(() => [] as Awaited<ReturnType<typeof fetchForecasts>>),
      fetchActuals(dateStr).catch(() => [] as Awaited<ReturnType<typeof fetchActuals>>),
    ])
      .then(([forecasts, actuals]) => {
        const map = new Map<number, ChartPoint>();

        // Seed map from forecasts
        forecasts.forEach((f) => {
          map.set(f.settlementPeriod, {
            startTime: f.startTime,
            settlementPeriod: f.settlementPeriod,
            label: periodToLabel(f.settlementPeriod),
            forecastMW: f.forecastMW,
            publishTime: f.publishTime,
          });
        });

        // Merge actuals
        actuals.forEach((a) => {
          const existing = map.get(a.settlementPeriod);
          if (existing) {
            map.set(a.settlementPeriod, { ...existing, actualMW: a.actualMW });
          } else {
            map.set(a.settlementPeriod, {
              startTime: a.startTime,
              settlementPeriod: a.settlementPeriod,
              label: periodToLabel(a.settlementPeriod),
              actualMW: a.actualMW,
            });
          }
        });

        const sorted = Array.from(map.values()).sort(
          (a, b) => a.settlementPeriod - b.settlementPeriod
        );
        setData(sorted);

        // Extract the publish time from the first forecast point (they share the same run)
        if (forecasts.length > 0) {
          setForecastPublishTime(forecasts[0].publishTime);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  return { data, loading, error, forecastPublishTime };
}
