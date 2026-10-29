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
import { TrendingUp, TrendingDown, Activity, Target, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  metrics: AccuracyMetrics;
}

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeText: string;
}

function KpiCard({ label, value, subtitle, icon, accentColor, badgeText }: KpiCardProps) {
  return (
    <div className="glass-card relative overflow-hidden group hover:border-slate-700/80 transition-all">
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold font-mono text-slate-100 tracking-tight">{value}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-xs">
        <span className="text-slate-400">{subtitle}</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300 border border-slate-800">
          {badgeText}
        </span>
      </div>
    </div>
  );
}

function periodToTime(period: number): string {
  const totalMin = (period - 1) * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function AccuracyPanel({ metrics }: Props) {
  const biasSign = metrics.bias >= 0 ? '+' : '';
  const isOverforecast = metrics.bias > 0;

  return (
    <div className="space-y-5">
      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="MAE (Mean Absolute Error)"
          value={`${metrics.mae.toFixed(0)} MW`}
          subtitle="Expected Error Magnitude"
          icon={<Target className="w-4 h-4 text-cyan-400" />}
          accentColor="bg-cyan-500"
          badgeText="Buffer Baseline"
        />
        <KpiCard
          label="RMSE (Root Mean Sq. Error)"
          value={`${metrics.rmse.toFixed(0)} MW`}
          subtitle="Extreme Variance Penalty"
          icon={<Activity className="w-4 h-4 text-purple-400" />}
          accentColor="bg-purple-500"
          badgeText="Tail Risk"
        />
        <KpiCard
          label="MAPE (Mean Abs. % Error)"
          value={`${metrics.mape.toFixed(1)}%`}
          subtitle="Normalized Relative Error"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          accentColor="bg-emerald-500"
          badgeText="Scale-Free"
        />
        <KpiCard
          label="Directional Bias"
          value={`${biasSign}${metrics.bias.toFixed(0)} MW`}
          subtitle={isOverforecast ? 'Net Over-Prediction' : 'Net Under-Prediction'}
          icon={isOverforecast ? <TrendingUp className="w-4 h-4 text-amber-400" /> : <TrendingDown className="w-4 h-4 text-indigo-400" />}
          accentColor={isOverforecast ? 'bg-amber-500' : 'bg-indigo-500'}
          badgeText={isOverforecast ? 'Deficit Risk' : 'Surplus Risk'}
        />
      </div>

      {/* ── Strategic Executive Insight ───────────────────────────────────── */}
      <div className="glass-card bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/20 border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0 mt-0.5">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-100 text-sm">
            Trader Guidance: How to size your Day-Ahead Purchase Buffer
          </p>
          <p className="leading-relaxed text-slate-400">
            Across <strong className="text-cyan-300 font-mono">{metrics.n_points.toLocaleString()}</strong> settlement periods evaluated in January 2026, the average national wind forecast discrepancy is{' '}
            <strong className="text-cyan-300 font-mono">{metrics.mae.toFixed(0)} MW</strong>. When locking in bilateral contracts or auction orders, carrying an additional reserve buffer of{' '}
            <strong className="text-emerald-300 font-mono">1.0x to 1.5x MAE (~{metrics.mae.toFixed(0)} to {(metrics.mae * 1.5).toFixed(0)} MW)</strong> protects against volatile balancing mechanism penalty cashout prices.
          </p>
        </div>
      </div>

      {/* ── Bias by Settlement Period ──────────────────────────────────────── */}
      <div className="glass-card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Diurnal Bias Profile by Settlement Period (MW)
            </h3>
            <p className="text-xs text-slate-400">
              Shows whether NESO forecasts systematically over-predict (amber) or under-predict (indigo) during specific times of day.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> &gt;0 Over-forecast
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> &lt;0 Under-forecast
            </span>
          </div>
        </div>

        <div className="w-full h-[250px] min-h-[250px] relative pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
            <BarChart data={metrics.error_by_period} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                interval={5}
                stroke="#334155"
                tickFormatter={periodToTime}
                label={{ value: 'Settlement Period (Half-Hourly UTC)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#64748b' }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const v = payload[0].value as number;
                  const sp = Number(label);
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-2.5 text-xs font-mono space-y-1 shadow-2xl">
                      <p className="text-slate-400">Period {sp} ({periodToTime(sp)} UTC)</p>
                      <p className={v >= 0 ? 'text-amber-400 font-bold' : 'text-indigo-400 font-bold'}>
                        Bias: {v >= 0 ? '+' : ''}{v.toFixed(1)} MW
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
              <Bar dataKey="bias" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {metrics.error_by_period.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.bias >= 0 ? '#f59e0b' : '#6366f1'}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Dual Column: Period MAE + Daily MAE ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MAE by Settlement Period */}
        <div className="glass-card space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Uncertainty Distribution Across the Day (MAE MW)
          </h3>
          <p className="text-xs text-slate-400">
            Identifies peak uncertainty intervals (e.g. evening thermal ramp-up).
          </p>
          <div className="w-full h-[220px] min-h-[220px] relative pt-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={metrics.error_by_period} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  interval={5}
                  stroke="#334155"
                  tickFormatter={periodToTime}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(0)} MW`, 'MAE']}
                  labelFormatter={(sp) => `Period ${sp} (${periodToTime(Number(sp))})`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Bar dataKey="mae" fill="#0ea5e9" radius={[2, 2, 0, 0]} opacity={0.85} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily MAE */}
        <div className="glass-card space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Daily Forecast MAE Trend (January 2026)
          </h3>
          <p className="text-xs text-slate-400">
            Track day-by-day forecast accuracy volatility across the month.
          </p>
          <div className="w-full h-[220px] min-h-[220px] relative pt-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={metrics.daily_summary} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  interval={4}
                  stroke="#334155"
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(0)} MW`]}
                  labelFormatter={(d) => `Date: ${d}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="mae" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} name="MAE (MW)" isAnimationActive={false} />
                <Line type="monotone" dataKey="rmse" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="RMSE (MW)" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Full Rolling Time-Series ───────────────────────────────────────── */}
      <div className="glass-card space-y-2">
        <h3 className="text-sm font-semibold text-slate-100">
          Continuous Hourly Forecast Error Stream — January 2026
        </h3>
        <p className="text-xs text-slate-400">
          Full 1,488 half-hour settlement periods. Visualizes prolonged periods of over-forecast vs under-forecast weather fronts.
        </p>
        <div className="w-full h-[220px] min-h-[220px] relative pt-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <LineChart
              data={metrics.time_series.map((p, i) => ({
                ...p,
                idx: i,
                label: p.startTime.slice(5, 10),
              }))}
              margin={{ top: 4, right: 12, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                interval={95}
                stroke="#334155"
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(0)} MW`]}
                labelFormatter={(d) => `Date: ${d}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
              />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              <Line type="monotone" dataKey="error" stroke="#f43f5e" strokeWidth={1.2} dot={false} name="Error Delta (MW)" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
