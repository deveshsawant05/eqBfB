import React from 'react';
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
} from 'recharts';
import type { AccuracyMetrics } from '../types';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface Props {
  metrics: AccuracyMetrics;
}

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  borderClass: string;
}

function KpiCard({ label, value, subtitle, icon, colorClass, borderClass }: KpiCardProps) {
  return (
    <div className={`kpi-card ${colorClass} ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="text-gray-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
  const biasLabel = metrics.bias > 50
    ? 'Systematic over-forecast'
    : metrics.bias < -50
    ? 'Systematic under-forecast'
    : 'Near-unbiased';

  return (
    <div className="space-y-5">
      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="MAE"
          value={`${metrics.mae.toFixed(0)} MW`}
          subtitle="Mean Absolute Error · use as buffer size"
          icon={<Target className="w-4 h-4" />}
          colorClass="bg-blue-50"
          borderClass="border-blue-100"
        />
        <KpiCard
          label="RMSE"
          value={`${metrics.rmse.toFixed(0)} MW`}
          subtitle="Root Mean Sq. Error · penalises large errors"
          icon={<Activity className="w-4 h-4" />}
          colorClass="bg-purple-50"
          borderClass="border-purple-100"
        />
        <KpiCard
          label="MAPE"
          value={`${metrics.mape.toFixed(1)}%`}
          subtitle="Mean Abs. % Error · scale-independent"
          icon={<Target className="w-4 h-4" />}
          colorClass="bg-yellow-50"
          borderClass="border-yellow-100"
        />
        <KpiCard
          label="Bias"
          value={`${biasSign}${metrics.bias.toFixed(0)} MW`}
          subtitle={biasLabel}
          icon={metrics.bias >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          colorClass={metrics.bias > 100 ? 'bg-orange-50' : metrics.bias < -100 ? 'bg-red-50' : 'bg-green-50'}
          borderClass={metrics.bias > 100 ? 'border-orange-100' : metrics.bias < -100 ? 'border-red-100' : 'border-green-100'}
        />
      </div>

      {/* ── Context Box ───────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
        <strong>📌 How to use these metrics:</strong> The MAE of <strong>{metrics.mae.toFixed(0)} MW</strong> represents
        the average wind forecast error. When buying from the day-ahead market, consider procuring an additional{' '}
        <strong>~{metrics.mae.toFixed(0)} MW</strong> as a buffer (or more if risk tolerance is low).
        {Math.abs(metrics.bias) > 50 && (
          <span> The systematic bias of <strong>{biasSign}{metrics.bias.toFixed(0)} MW</strong> means forecasts tend to
          {metrics.bias > 0 ? ' over-predict' : ' under-predict'} wind output — adjust your base procurement accordingly.</span>
        )}
        {' '}Based on <strong>{metrics.n_points.toLocaleString()}</strong> matched data points across January 2026.
      </div>

      {/* ── Bias by Settlement Period ──────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Forecast Bias by Settlement Period (MW) — January 2026 Average
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Positive = over-forecast (forecast &gt; actual). Negative = under-forecast.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metrics.error_by_period} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval={5}
              tickFormatter={periodToTime}
              label={{ value: 'Settlement Period (UTC)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(0)} MW`]}
              labelFormatter={(sp) => `Period ${sp} (${periodToTime(Number(sp))})`}
            />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
            <Bar dataKey="bias" name="Bias (MW)" fill="#6366f1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── MAE by Settlement Period ───────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          MAE by Settlement Period (MW) — January 2026 Average
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Which periods of the day carry the most forecast uncertainty?
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={metrics.error_by_period} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval={5}
              tickFormatter={periodToTime}
              label={{ value: 'Settlement Period (UTC)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(0)} MW`]}
              labelFormatter={(sp) => `Period ${sp} (${periodToTime(Number(sp))})`}
            />
            <Bar dataKey="mae" name="MAE (MW)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily MAE ─────────────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Daily Forecast MAE — January 2026
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Were some days harder to forecast than others?
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics.daily_summary} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval={4}
              tickFormatter={(d: string) => d.slice(5)}
              label={{ value: 'Date (Jan 2026)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(0)} MW`]} labelFormatter={(d) => `Date: ${d}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="mae" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="MAE (MW)" />
            <Line type="monotone" dataKey="rmse" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="RMSE (MW)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Full Time Series ───────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          Forecast Error Over Time — January 2026
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Rolling error across all 48 × 31 = 1,488 settlement periods. Positive = over-forecast.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={metrics.time_series.map((p, i) => ({
              ...p,
              idx: i,
              label: p.startTime.slice(5, 10),
            }))}
            margin={{ top: 4, right: 8, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval={47}
              label={{ value: 'Date', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(v: number) => [`${v.toFixed(0)} MW`]}
              labelFormatter={(d) => `Date: ${d}`}
            />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
            <Line type="monotone" dataKey="error" stroke="#ef4444" strokeWidth={1} dot={false} name="Error (MW)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
