import { useState, useEffect } from 'react';
import { fetchForecasts, fetchActuals } from '../api/client';
import type { ChartPoint } from '../types';
import { format } from 'date-fns';

/** Formats settlement period number (1..48) to HH:MM string */
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

    let fcErr: Error | null = null;
    let actErr: Error | null = null;

    Promise.all([
      fetchForecasts(dateStr).catch((err) => {
        fcErr = err;
        return [];
      }),
      fetchActuals(dateStr).catch((err) => {
        actErr = err;
        return [];
      }),
    ])
      .then(([forecasts, actuals]) => {
        if (forecasts.length === 0 && actuals.length === 0) {
          const msg =
            fcErr?.message || actErr?.message || `No data returned for ${dateStr}`;
          setError(msg);
          return;
        }

        const map = new Map<number, ChartPoint>();

        // Pre-seed all 48 settlement periods so axis is always continuous
        for (let sp = 1; sp <= 48; sp++) {
          map.set(sp, {
            startTime: '',
            settlementPeriod: sp,
            label: periodToLabel(sp),
          });
        }

        // Merge forecasts
        forecasts.forEach((f) => {
          const pt = map.get(f.settlementPeriod);
          if (pt) {
            pt.startTime = f.startTime;
            pt.forecastMW = f.forecastMW;
            pt.publishTime = f.publishTime;
          }
        });

        // Merge actuals
        actuals.forEach((a) => {
          const pt = map.get(a.settlementPeriod);
          if (pt) {
            if (!pt.startTime) pt.startTime = a.startTime;
            pt.actualMW = a.actualMW;
          }
        });

        const sorted = Array.from(map.values()).sort(
          (a, b) => a.settlementPeriod - b.settlementPeriod
        );
        setData(sorted);

        // Extract the publish time from the first valid forecast point
        const firstWithPub = forecasts.find((f) => f.publishTime);
        if (firstWithPub) {
          setForecastPublishTime(firstWithPub.publishTime);
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  return { data, loading, error, forecastPublishTime };
}
