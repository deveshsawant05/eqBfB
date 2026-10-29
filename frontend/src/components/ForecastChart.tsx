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
  payload?: Array<{ name: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const forecast = payload.find((p) => p.dataKey === 'forecastMW' || p.name === 'Day-Ahead Forecast');
  const actual = payload.find((p) => p.dataKey === 'actualMW' || p.name === 'Actual Outturn');
  const diff =
    forecast?.value != null && actual?.value != null
      ? forecast.value - actual.value
      : null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md p-3 text-xs min-w-[200px] space-y-1.5">
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-slate-500 font-mono">
        <span>Settlement Period {label}</span>
      </div>

      {forecast?.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
            Forecast:
          </span>
          <span className="font-mono font-semibold text-slate-900">
            {forecast.value.toLocaleString()} MW
          </span>
        </div>
      )}

      {actual?.value != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            Actual Outturn:
          </span>
          <span className="font-mono font-semibold text-slate-900">
            {actual.value.toLocaleString()} MW
          </span>
        </div>
      )}

      {diff != null && (
        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Error (Forecast − Actual):</span>
          <span
            className={`font-mono font-medium ${
              diff > 0 ? 'text-amber-700' : 'text-slate-700'
            }`}
          >
            {diff > 0 ? '+' : ''}{diff.toFixed(0)} MW
          </span>
        </div>
      )}
    </div>
  );
};

export function ForecastChart({ data, selectedDate, forecastPublishTime }: Props) {
  const forecastPoints = data.filter((d) => d.forecastMW != null);
  const actualPoints = data.filter((d) => d.actualMW != null);

  const peakForecast = forecastPoints.length > 0 ? Math.max(...forecastPoints.map((d) => d.forecastMW!)) : 0;
  const peakActual = actualPoints.length > 0 ? Math.max(...actualPoints.map((d) => d.actualMW!)) : 0;

  const avgForecast =
    forecastPoints.length > 0
      ? forecastPoints.reduce((acc, d) => acc + d.forecastMW!, 0) / forecastPoints.length
      : 0;

  // Single day MAE
  const paired = data.filter((d) => d.forecastMW != null && d.actualMW != null);
  const dayMae =
    paired.length > 0
      ? paired.reduce((acc, d) => acc + Math.abs(d.forecastMW! - d.actualMW!), 0) / paired.length
      : null;

  const publishFormatted = forecastPublishTime
    ? format(new Date(forecastPublishTime), "d MMM yyyy, HH:mm 'UTC'")
    : null;

  return (
    <div className="panel space-y-4">
      {/* Title & Metadata */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Wind Power Generation — {format(selectedDate, 'd MMMM yyyy')}
          </h2>
          {publishFormatted && (
            <p className="text-xs text-slate-500 mt-0.5">
              Forecast issued: <span className="font-mono text-slate-700 font-medium">{publishFormatted}</span> (latest before gate closure)
            </p>
          )}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Elexon BMRS · National GB Outturn
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Peak Forecast</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {peakForecast.toLocaleString()} <span className="text-xs font-normal text-slate-500">MW</span>
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Peak Actual</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {actualPoints.length > 0 ? peakActual.toLocaleString() : '—'}{' '}
            <span className="text-xs font-normal text-slate-500">MW</span>
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Average Forecast</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {Math.round(avgForecast).toLocaleString()} <span className="text-xs font-normal text-slate-500">MW</span>
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Day Error (MAE)</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {dayMae != null ? `${Math.round(dayMae).toLocaleString()} MW` : '—'}
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[380px] min-h-[380px] relative pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={380}>
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={5}
              stroke="#cbd5e1"
              label={{
                value: 'Settlement Period (Half-Hour Beginning UTC)',
                position: 'insideBottom',
                offset: -12,
                fontSize: 11,
                fill: '#64748b',
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              stroke="#cbd5e1"
              label={{
                value: 'Generation (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fontSize: 11,
                fill: '#64748b',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
            />

            {/* Day-Ahead Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecastMW"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 2, fill: '#0284c7' }}
              activeDot={{ r: 4 }}
              name="Day-Ahead Forecast"
              connectNulls={true}
              isAnimationActive={false}
            />

            {/* Actual Outturn Line */}
            {actualPoints.length > 0 && (
              <Line
                type="monotone"
                dataKey="actualMW"
                stroke="#059669"
                strokeWidth={1.8}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: '#059669' }}
                activeDot={{ r: 4 }}
                name="Actual Outturn"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footnote */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Datasets: WINDFOR (Forecast) · FUELHH (Outturn)</span>
        <span>Resolution: 30 minutes (Periods 1 to 48)</span>
      </div>
    </div>
  );
}
