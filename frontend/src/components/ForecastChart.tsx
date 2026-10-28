import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartPoint } from '../types';
import { format } from 'date-fns';

interface Props {
  data: ChartPoint[];
  selectedDate: Date;
  forecastPublishTime: string | null;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const forecast = payload.find((p) => p.name === 'Day-Ahead Forecast');
  const actual = payload.find((p) => p.name === 'Actual Generation');
  const diff =
    forecast?.value != null && actual?.value != null
      ? forecast.value - actual.value
      : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-700 mb-2">Period {label}</p>
      {forecast && (
        <p style={{ color: forecast.color }}>
          Forecast: <strong>{forecast.value.toFixed(0)} MW</strong>
        </p>
      )}
      {actual && (
        <p style={{ color: actual.color }}>
          Actual: <strong>{actual.value.toFixed(0)} MW</strong>
        </p>
      )}
      {diff != null && (
        <p className={`mt-1 font-medium ${diff > 0 ? 'text-orange-600' : 'text-green-700'}`}>
          Error: {diff > 0 ? '+' : ''}{diff.toFixed(0)} MW
          <span className="text-xs font-normal ml-1">
            ({diff > 0 ? 'over' : 'under'}-forecast)
          </span>
        </p>
      )}
    </div>
  );
};

export function ForecastChart({ data, selectedDate, forecastPublishTime }: Props) {
  const peakForecast = Math.max(...data.map((d) => d.forecastMW ?? 0));
  const peakActual = Math.max(...data.map((d) => d.actualMW ?? 0));
  const hasActuals = data.some((d) => d.actualMW != null);

  const publishFormatted = forecastPublishTime
    ? format(new Date(forecastPublishTime), "d MMM yyyy HH:mm 'UTC'")
    : null;

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Wind Generation: Forecast vs Actual — {format(selectedDate, 'd MMMM yyyy')}
          </h2>
          {publishFormatted && (
            <p className="text-xs text-gray-500 mt-0.5">
              Forecast run: <span className="font-medium text-blue-700">{publishFormatted}</span>
              {' '}<span className="text-gray-400">(latest before D-1 12:00 UTC gate closure)</span>
            </p>
          )}
        </div>
        <div className="flex gap-4 text-xs text-gray-600">
          {peakForecast > 0 && (
            <span>Peak forecast: <strong className="text-blue-700">{peakForecast.toFixed(0)} MW</strong></span>
          )}
          {hasActuals && peakActual > 0 && (
            <span>Peak actual: <strong className="text-emerald-700">{peakActual.toFixed(0)} MW</strong></span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            interval={5}
            label={{
              value: 'Settlement Period (UTC)',
              position: 'insideBottom',
              offset: -12,
              fontSize: 11,
              fill: '#9ca3af',
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            label={{
              value: 'MW',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              fontSize: 11,
              fill: '#9ca3af',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="forecastMW"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Day-Ahead Forecast"
            connectNulls={false}
          />
          {hasActuals && (
            <Line
              type="monotone"
              dataKey="actualMW"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              strokeDasharray="6 3"
              name="Actual Generation"
              connectNulls={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {!hasActuals && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ Actual generation data not yet available for this date. Actuals are published by Elexon after settlement runs complete.
        </p>
      )}

      <p className="text-xs text-gray-400">
        Source: Elexon BMRS — WINDFOR (forecast) &amp; FUELHH (actual, fuelType=WIND). National GB level.
      </p>
    </div>
  );
}
