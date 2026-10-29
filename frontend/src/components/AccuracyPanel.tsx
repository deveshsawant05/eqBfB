import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import type { AccuracyMetrics } from '../types';

interface Props {
  metrics: AccuracyMetrics;
}

function periodToTime(period: number): string {
  const totalMin = (period - 1) * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function AccuracyPanel({ metrics }: Props) {
  const biasSign = metrics.bias >= 0 ? '+' : '';

  return (
    <div className="space-y-4">
      {/* ── 4 KPI Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mean Absolute Error (MAE)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {metrics.mae.toFixed(0)} <span className="text-sm font-normal text-slate-500">MW</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Average forecast deviation</p>
        </div>

        <div className="stat-card">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Root Mean Squared Error (RMSE)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {metrics.rmse.toFixed(0)} <span className="text-sm font-normal text-slate-500">MW</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Weights larger errors more heavily</p>
        </div>

        <div className="stat-card">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Percentage Error (MAPE)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {metrics.mape.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Relative to actual generation</p>
        </div>

        <div className="stat-card">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mean Directional Bias</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {biasSign}{metrics.bias.toFixed(0)} <span className="text-sm font-normal text-slate-500">MW</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {metrics.bias > 0 ? 'Forecasts tended to overestimate' : 'Forecasts tended to underestimate'}
          </p>
        </div>
      </div>

      {/* ── Brief Summary Note ────────────────────────────────────────────── */}
      <div className="panel bg-slate-50 border-slate-200 text-xs text-slate-600 leading-relaxed">
        <p>
          <strong className="text-slate-800">Operational context:</strong> Evaluated across{' '}
          <span className="font-mono font-medium text-slate-800">{metrics.n_points.toLocaleString()}</span> half-hourly settlement periods in January 2026.
          When sizing day-ahead procurement decisions, an MAE of{' '}
          <span className="font-mono font-medium text-slate-800">{metrics.mae.toFixed(0)} MW</span> provides the baseline margin needed to absorb forecast deviations before turning to the Balancing Mechanism.
        </p>
      </div>

      {/* ── Bias by Settlement Period ──────────────────────────────────────── */}
      <div className="panel space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Average Forecast Bias by Settlement Period (MW)
            </h3>
            <p className="text-xs text-slate-500">
              Positive values indicate periods where forecasts were higher than actual generation.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" /> Positive Bias
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#64748b]" /> Negative Bias
            </span>
          </div>
        </div>

        <div className="w-full h-[240px] min-h-[240px] relative pt-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <BarChart data={metrics.error_by_period} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 9, fill: '#64748b' }}
                interval={5}
                stroke="#cbd5e1"
                tickFormatter={periodToTime}
                label={{ value: 'Settlement Period (Half-Hour Beginning UTC)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const v = payload[0].value as number;
                  const sp = Number(label);
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-md p-2.5 text-xs font-mono space-y-0.5">
                      <p className="text-slate-500">Period {sp} ({periodToTime(sp)} UTC)</p>
                      <p className="font-semibold text-slate-900">
                        Bias: {v >= 0 ? '+' : ''}{v.toFixed(1)} MW
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
              <Bar dataKey="bias" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {metrics.error_by_period.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.bias >= 0 ? '#0284c7' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Daily MAE Trend ────────────────────────────────────────────────── */}
      <div className="panel space-y-2">
        <div className="pb-1 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Daily Forecast MAE (January 2026)
          </h3>
          <p className="text-xs text-slate-500">
            Day-by-day mean absolute error across the 31 delivery days of the month.
          </p>
        </div>

        <div className="w-full h-[230px] min-h-[230px] relative pt-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
            <LineChart data={metrics.daily_summary} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#64748b' }}
                interval={3}
                stroke="#cbd5e1"
                tickFormatter={(d: string) => d.slice(5)}
                label={{ value: 'Date (MM-DD)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
              <Tooltip
                formatter={(v: number) => [`${Math.round(v)} MW`]}
                labelFormatter={(d) => `Date: ${d}`}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="mae" stroke="#0284c7" strokeWidth={1.8} dot={{ r: 2 }} name="MAE (MW)" isAnimationActive={false} />
              <Line type="monotone" dataKey="rmse" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} name="RMSE (MW)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
