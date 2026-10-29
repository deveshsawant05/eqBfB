import { useState, useEffect } from 'react';
import { DateSelector } from '../components/DateSelector';
import { ForecastChart } from '../components/ForecastChart';
import { AccuracyPanel } from '../components/AccuracyPanel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useForecastData } from '../hooks/useForecastData';
import { useAccuracyData } from '../hooks/useAccuracyData';
import { LineChart, BarChart2 } from 'lucide-react';

type Tab = 'forecast' | 'accuracy';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'forecast', label: 'Forecast vs Actuals', icon: <LineChart className="w-4 h-4" /> },
  { id: 'accuracy', label: 'Accuracy Evaluation', icon: <BarChart2 className="w-4 h-4" /> },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-01-15'));
  const [activeTab, setActiveTab] = useState<Tab>('forecast');

  const { data, loading, error, forecastPublishTime } = useForecastData(selectedDate);
  const { metrics, loading: accLoading, error: accError, load: loadAccuracy } = useAccuracyData();

  // Load accuracy data when switching to the accuracy tab
  useEffect(() => {
    if (activeTab === 'accuracy') {
      loadAccuracy();
    }
  }, [activeTab, loadAccuracy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-3.5 flex flex-wrap items-center justify-between gap-4">
            {/* Brand Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">GridBricks</span>
                <span className="text-slate-300">/</span>
                <span className="text-sm font-medium text-slate-600">Wind Intelligence</span>
              </div>
              <p className="text-xs text-slate-500">
                UK Day-Ahead Electricity Market · January 2026
              </p>
            </div>

            {/* Source indicator */}
            <div className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
              Data: Elexon BMRS (GB Wind)
            </div>
          </div>

          {/* Clean Underline Tabs */}
          <div className="flex gap-4 border-t border-slate-100 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 tab-btn ${
                  activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
        {/* ── TAB 1: FORECAST VIEW ───────────────────────────────────────── */}
        {activeTab === 'forecast' && (
          <>
            <DateSelector value={selectedDate} onChange={setSelectedDate} />

            {loading && <LoadingSpinner message="Fetching wind generation data for selected day…" />}
            {!loading && error && <ErrorBanner message={error} />}
            {!loading && !error && data.length > 0 && (
              <ForecastChart
                data={data}
                selectedDate={selectedDate}
                forecastPublishTime={forecastPublishTime}
              />
            )}
            {!loading && !error && data.length === 0 && (
              <div className="panel text-center py-12 text-slate-500 space-y-1">
                <p className="text-sm font-medium text-slate-700">No records found for this date.</p>
                <p className="text-xs font-mono text-slate-400">Please choose another delivery date in January 2026.</p>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: ACCURACY METRICS ────────────────────────────────────── */}
        {activeTab === 'accuracy' && (
          <>
            {accLoading && (
              <LoadingSpinner message="Evaluating forecast accuracy and bias metrics across January 2026…" />
            )}
            {!accLoading && accError && <ErrorBanner message={accError} />}
            {!accLoading && !accError && metrics && (
              <AccuracyPanel metrics={metrics} />
            )}
          </>
        )}
      </main>

      {/* ── Clean Professional Footer ─────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-auto text-xs text-slate-500 py-4 font-mono">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>GridBricks · Wind Generation Forecast &amp; Outturn Analytics</span>
          <span>Data source: Elexon BMRS (WINDFOR &amp; FUELHH)</span>
        </div>
      </footer>
    </div>
  );
}
