import { useState, useMemo } from 'react';
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
import { Flame, ShieldCheck, Sliders } from 'lucide-react';

interface Props {
  data: ChartPoint[];
  mae: number;
}

export function ProcurementCalculator({ data, mae }: Props) {
  const [peakDemand, setPeakDemand] = useState<number>(26000);
  const [bufferMultiplier, setBufferMultiplier] = useState<number>(1.0);

  // Typical UK winter diurnal demand index curve (normalized 0.65 at night to 1.0 at 17:30 evening peak)
  const procurementSchedule = useMemo(() => {
    return data.map((pt) => {
      const sp = pt.settlementPeriod;
      // Synthesize realistic GB winter demand curve across 48 periods
      const hour = (sp - 1) / 2;
      let demandFactor = 0.65;
      if (hour >= 6 && hour <= 9) {
        demandFactor = 0.65 + 0.25 * ((hour - 6) / 3); // morning rise
      } else if (hour > 9 && hour < 16) {
        demandFactor = 0.88; // daytime flat
      } else if (hour >= 16 && hour <= 19) {
        demandFactor = 0.88 + 0.12 * Math.sin(((hour - 16) / 3) * Math.PI); // 17:30 peak
      } else if (hour > 19) {
        demandFactor = 0.88 - 0.23 * ((hour - 19) / 5); // night drop
      }

      const consumerDemand = Math.round(peakDemand * demandFactor);
      const windForecast = pt.forecastMW ?? 0;
      const buffer = Math.round(mae * bufferMultiplier);

      // Thermal procurement required = Demand - Wind Forecast + Safety Buffer
      const thermalProcurement = Math.max(0, consumerDemand - windForecast + buffer);
      const windSharePct = Math.min(100, (windForecast / consumerDemand) * 100);

      return {
        label: pt.label,
        settlementPeriod: sp,
        consumerDemand,
        windForecast,
        buffer,
        thermalProcurement,
        windSharePct: Number(windSharePct.toFixed(1)),
      };
    });
  }, [data, peakDemand, bufferMultiplier, mae]);

  const peakThermalNeed = Math.max(...procurementSchedule.map((p) => p.thermalProcurement), 0);
  const avgWindCoverage =
    procurementSchedule.length > 0
      ? procurementSchedule.reduce((acc, p) => acc + p.windSharePct, 0) / procurementSchedule.length
      : 0;
  const totalThermalGWh =
    procurementSchedule.reduce((acc, p) => acc + (p.thermalProcurement * 0.5) / 1000, 0);

  return (
    <div className="glass-card space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Day-Ahead Procurement Advisory &amp; Buffer Sizing
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Decision Support
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculate the exact thermal &amp; wholesale power required beyond wind forecasts, factoring in quantified error risk.
          </p>
        </div>

        {/* Input parameter controls */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Peak Demand:</span>
            <input
              type="number"
              min={10000}
              max={55000}
              step={1000}
              value={peakDemand}
              onChange={(e) => setPeakDemand(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-cyan-300 font-mono text-xs w-24 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-slate-400">MW</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Error Buffer:</span>
            {[0, 1.0, 1.5, 2.0].map((mult) => (
              <button
                key={mult}
                onClick={() => setBufferMultiplier(mult)}
                className={`px-2 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  bufferMultiplier === mult
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mult === 0 ? 'None' : `${mult}x MAE`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">Wind Coverage Ratio</span>
          <p className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {avgWindCoverage.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-400">Avg demand met by wind</span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">Peak Thermal Required</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">
            {peakThermalNeed.toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
          </p>
          <span className="text-[10px] text-slate-400">Max hourly procurement need</span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">Active Risk Buffer</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +{Math.round(mae * bufferMultiplier).toLocaleString()} <span className="text-xs font-normal text-slate-400">MW</span>
          </p>
          <span className="text-[10px] text-slate-400">Based on historical MAE ({mae.toFixed(0)} MW)</span>
        </div>

        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">Day Thermal Volume</span>
          <p className="text-xl font-bold font-mono text-indigo-300 mt-1">
            {totalThermalGWh.toFixed(1)} <span className="text-xs font-normal text-slate-400">GWh</span>
          </p>
          <span className="text-[10px] text-slate-400">Total market power to procure</span>
        </div>
      </div>

      {/* Procurement Schedule Chart */}
      <div className="w-full h-[360px] min-h-[360px] relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={360}>
          <ComposedChart data={procurementSchedule} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="thermalGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={5} stroke="#334155" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5 shadow-2xl">
                    <p className="font-mono text-slate-400 pb-1 border-b border-slate-800">
                      Period {label} (SP {d?.settlementPeriod})
                    </p>
                    <div className="flex justify-between gap-4 text-slate-300">
                      <span>Consumer Demand:</span>
                      <strong className="font-mono text-slate-100">{d?.consumerDemand.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between gap-4 text-cyan-300">
                      <span>Wind Forecast:</span>
                      <strong className="font-mono">{d?.windForecast.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between gap-4 text-emerald-300">
                      <span>Buffer Applied:</span>
                      <strong className="font-mono">+{d?.buffer.toLocaleString()} MW</strong>
                    </div>
                    <div className="flex justify-between gap-4 text-amber-300 pt-1 border-t border-slate-800 font-bold">
                      <span>Thermal to Buy:</span>
                      <strong className="font-mono text-sm">{d?.thermalProcurement.toLocaleString()} MW</strong>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
            />

            <Line
              type="monotone"
              dataKey="consumerDemand"
              stroke="#94a3b8"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
              name="Gross Consumer Demand"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="windForecast"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="Renewable Wind Generation"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="thermalProcurement"
              fill="url(#thermalGlow)"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 2, fill: '#f59e0b' }}
              name="Additional Procurement Needed"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
