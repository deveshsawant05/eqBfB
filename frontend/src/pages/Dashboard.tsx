import { useState, useEffect } from 'react';
import { DateSelector } from '../components/DateSelector';
import { ForecastChart } from '../components/ForecastChart';
import { AccuracyPanel } from '../components/AccuracyPanel';
import { ProcurementCalculator } from '../components/ProcurementCalculator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useForecastData } from '../hooks/useForecastData';
import { useAccuracyData } from '../hooks/useAccuracyData';
import { Wind, BarChart2, Flame, Radio } from 'lucide-react';

type Tab = 'forecast' | 'accuracy' | 'procurement';

const TABS: { id: Tab; label: string; badge?: string; icon: React.ReactNode }[] = [
  { id: 'forecast', label: 'Day-Ahead Curve', icon: <Wind className="w-4 h-4" /> },
  { id: 'accuracy', label: 'Quantified Accuracy', badge: 'Jan 2026', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'procurement', label: 'Procurement Advisory', badge: 'Trading Desk', icon: <Flame className="w-4 h-4" /> },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-01-15'));
  const [activeTab, setActiveTab] = useState<Tab>('forecast');

  const { data, loading, error, forecastPublishTime } = useForecastData(selectedDate);
  const { metrics, loading: accLoading, error: accError, load: loadAccuracy } = useAccuracyData();

  // Pre-load accuracy data when switching to accuracy or procurement tabs
  useEffect(() => {
    if (activeTab === 'accuracy' || activeTab === 'procurement') {
      loadAccuracy();
    }
  }, [activeTab, loadAccuracy]);

  const defaultMae = metrics?.mae ?? 1650; // default baseline MAE if not yet loaded

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* ── Top Navigation / Brand Header ─────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">
                  GridBricks <span className="font-light text-slate-400">Wind</span>
                </h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Elexon BMRS Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                UK Day-Ahead Wholesale Power Procurement · January 2026 Horizon
              </p>
            </div>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'nav-tab-active shadow-sm'
                    : 'nav-tab-inactive'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right Status Pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>National GB Wind Outturn</span>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {/* ── TAB 1: FORECAST VIEW ───────────────────────────────────────── */}
        {activeTab === 'forecast' && (
          <>
            <DateSelector value={selectedDate} onChange={setSelectedDate} />

            {loading && <LoadingSpinner message="Retrieving wind actuals & day-ahead forecast for selected delivery day…" />}
            {!loading && error && <ErrorBanner message={error} />}
            {!loading && !error && data.length > 0 && (
              <ForecastChart
                data={data}
                selectedDate={selectedDate}
                forecastPublishTime={forecastPublishTime}
              />
            )}
            {!loading && !error && data.length === 0 && (
              <div className="glass-card text-center py-12 text-slate-400 space-y-2">
                <Wind className="w-10 h-10 mx-auto text-slate-400" />
                <p className="text-sm font-medium text-slate-300">No records returned for this date.</p>
                <p className="text-xs text-slate-400 font-mono">Please select another date in January 2026.</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: ACCURACY METRICS ────────────────────────────────────── */}
        {activeTab === 'accuracy' && (
          <>
            {accLoading && (
              <LoadingSpinner message="Computing monthly accuracy metrics, error distributions & diurnal bias profiles for January 2026…" />
            )}
            {!accLoading && accError && <ErrorBanner message={accError} />}
            {!accLoading && !accError && metrics && (
              <AccuracyPanel metrics={metrics} />
            )}
          </>
        )}

        {/* ── TAB 3: PROCUREMENT ADVISORY ────────────────────────────────── */}
        {activeTab === 'procurement' && (
          <>
            <DateSelector value={selectedDate} onChange={setSelectedDate} />

            {loading && <LoadingSpinner message="Calculating net thermal procurement and risk buffers…" />}
            {!loading && error && <ErrorBanner message={error} />}
            {!loading && !error && data.length > 0 && (
              <ProcurementCalculator data={data} mae={defaultMae} />
            )}
          </>
        )}
      </main>

      {/* ── Elevated Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-lg mt-auto text-xs text-slate-400 py-4 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">GridBricks</span>
            <span>·</span>
            <span>UK Day-Ahead Energy Procurement Engine</span>
            <span>·</span>
            <span className="text-slate-400">Data source: Elexon BMRS Insights API</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>React 19</span>
            <span>·</span>
            <span>FastAPI Python</span>
            <span>·</span>
            <span>AI Assisted (Google Antigravity)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
