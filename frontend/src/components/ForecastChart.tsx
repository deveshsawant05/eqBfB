import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartPoint } from '../types';
import { format } from 'date-fns';
import { Wind, Activity, Zap, ShieldAlert } from 'lucide-react';

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
  const actual = payload.find((p) => p.dataKey === 'actualMW' || p.name === 'Actual Generation');
  const diff =
    forecast?.value != null && actual?.value != null
      ? forecast.value - actual.value
      : null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl p-3.5 text-xs min-w-[220px] space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 font-mono">
        <span>Period {label}</span>
        <span className="text-[10px] text-cyan-400">30m Interval</span>
      </div>

      {forecast?.value != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
            Forecast:
          </span>
          <span className="font-mono font-bold text-cyan-300 text-sm">
            {forecast.value.toLocaleString()} MW
          </span>
        </div>
      )}

      {actual?.value != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            Actual Outturn:
          </span>
          <span className="font-mono font-bold text-emerald-300 text-sm">
            {actual.value.toLocaleString()} MW
          </span>
        </div>
      )}

      {diff != null && (
        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">Decision Delta:</span>
          <span
            className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[11px] ${
              diff > 0
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {diff > 0 ? '+' : ''}{diff.toFixed(0)} MW {diff > 0 ? '(Over)' : '(Under)'}
          </span>
        </div>
      )}
    </div>
  );
};

export function ForecastChart({ data, selectedDate, forecastPublishTime }: Props) {
  const [showForecast, setShowForecast] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showGlow, setShowGlow] = useState(true);

  const forecastPoints = data.filter((d) => d.forecastMW != null);
  const actualPoints = data.filter((d) => d.actualMW != null);

  const peakForecast = forecastPoints.length > 0 ? Math.max(...forecastPoints.map((d) => d.forecastMW!)) : 0;
  const peakActual = actualPoints.length > 0 ? Math.max(...actualPoints.map((d) => d.actualMW!)) : 0;
  
  // Total daily estimated energy (GWh): each period is 0.5 hours -> MW * 0.5 / 1000 = GWh
  const totalForecastGWh = forecastPoints.reduce((acc, d) => acc + (d.forecastMW! * 0.5) / 1000, 0);
  const totalActualGWh = actualPoints.reduce((acc, d) => acc + (d.actualMW! * 0.5) / 1000, 0);

  // Mean Absolute Error for the single day (if actuals exist)
  const paired = data.filter((d) => d.forecastMW != null && d.actualMW != null);
  const dayMae =
    paired.length > 0
      ? paired.reduce((acc, d) => acc + Math.abs(d.forecastMW! - d.actualMW!), 0) / paired.length
      : null;

  const publishFormatted = forecastPublishTime
    ? format(new Date(forecastPublishTime), "d MMM yyyy HH:mm 'UTC'")
    : null;

  return (
    <div className="glass-card space-y-4">
      {/* Chart Top Header & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              Wind Generation Profile: Day-Ahead Forecast vs Outturn
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              {format(selectedDate, 'd MMM yyyy')}
            </span>
          </div>
          {publishFormatted && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Decision-time Forecast Run:</span>
              <span className="font-mono text-cyan-300 font-medium bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                {publishFormatted}
              </span>
              <span className="text-slate-400">(NESO run published prior to D-1 12:00 UTC gate closure)</span>
            </p>
          )}
        </div>

        {/* Layer display toggles */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              showForecast ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Forecast
          </button>
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              showActual ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Actuals
          </button>
          <button
            onClick={() => setShowGlow(!showGlow)}
            className={`px-2 py-1 rounded-lg transition-all ${
              showGlow ? 'text-slate-200 bg-slate-800' : 'text-slate-400'
            }`}
            title="Toggle Area Gradient Fill"
          >
            Glow {showGlow ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Quick Day Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">Peak Forecast</span>
            <p className="text-base font-bold font-mono text-cyan-300">
              {peakForecast.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">Peak Actual Outturn</span>
            <p className="text-base font-bold font-mono text-emerald-300">
              {actualPoints.length > 0 ? peakActual.toLocaleString() : 'Pending'}{' '}
              <span className="text-xs font-normal text-slate-400">MW</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">Est. Day Outturn</span>
            <p className="text-base font-bold font-mono text-indigo-300">
              {totalActualGWh > 0 ? totalActualGWh.toFixed(1) : totalForecastGWh.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">GWh</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wide">Day MAE Error</span>
            <p className="text-base font-bold font-mono text-amber-300">
              {dayMae != null ? `${dayMae.toFixed(0)} MW` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[390px] min-h-[390px] relative pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={390}>
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="forecastGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.20} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval={5}
              stroke="#334155"
              label={{
                value: 'Settlement Period (Half-Hourly UTC)',
                position: 'insideBottom',
                offset: -12,
                fontSize: 11,
                fill: '#64748b',
              }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              stroke="#334155"
              label={{
                value: 'Megawatts (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                fontSize: 11,
                fill: '#64748b',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
            />

            {/* Optional Area Glows */}
            {showGlow && showForecast && (
              <Area
                type="monotone"
                dataKey="forecastMW"
                fill="url(#forecastGlow)"
                stroke="none"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}
            {showGlow && showActual && (
              <Area
                type="monotone"
                dataKey="actualMW"
                fill="url(#actualGlow)"
                stroke="none"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecastMW"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#38bdf8' }}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#080c14', strokeWidth: 2 }}
                name="Day-Ahead Forecast"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Actual Outturn Line */}
            {showActual && actualPoints.length > 0 && (
              <Line
                type="monotone"
                dataKey="actualMW"
                stroke="#10b981"
                strokeWidth={2.2}
                dot={{ r: 2, fill: '#10b981' }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#080c14', strokeWidth: 2 }}
                strokeDasharray="4 3"
                name="Actual Generation"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer provenance */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <span>Elexon BMRS feeds: WINDFOR (Day-Ahead Forecast) &amp; FUELHH (Outturn, fuelType=WIND)</span>
        <span>Resolution: 30-minute settlement periods (SP 1 to SP 48)</span>
      </div>
    </div>
  );
}
