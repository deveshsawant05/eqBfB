import React, { useState, useEffect } from 'react';
import { DateSelector } from '../components/DateSelector';
import { ForecastChart } from '../components/ForecastChart';
import { AccuracyPanel } from '../components/AccuracyPanel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useForecastData } from '../hooks/useForecastData';
import { useAccuracyData } from '../hooks/useAccuracyData';
import { Wind, BarChart2, Info } from 'lucide-react';

type Tab = 'forecast' | 'accuracy';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'forecast', label: 'Forecast View', icon: <Wind className="w-4 h-4" /> },
  { id: 'accuracy', label: 'Accuracy Metrics', icon: <BarChart2 className="w-4 h-4" /> },
];

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-01-15'));
  const [activeTab, setActiveTab] = useState<Tab>('forecast');

  const { data, loading, error, forecastPublishTime } = useForecastData(selectedDate);
  const { metrics, loading: accLoading, error: accError, load: loadAccuracy } = useAccuracyData();

  // Load accuracy data as soon as user switches to the tab
  useEffect(() => {
    if (activeTab === 'accuracy') loadAccuracy();
  }, [activeTab, loadAccuracy]);

  const peakForecast = data.length > 0
    ? Math.max(...data.map((d) => d.forecastMW ?? 0))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">⚡</span>
            <div className="leading-tight">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">GridBricks</h1>
              <p className="text-xs text-gray-500">Wind Intelligence Dashboard · January 2026</p>
            </div>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Info className="w-3.5 h-3.5" />
            Data: Elexon BMRS API · National GB Wind
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-4">
        {/* ── FORECAST TAB ────────────────────────────────────────────────── */}
        {activeTab === 'forecast' && (
          <>
            <DateSelector value={selectedDate} onChange={setSelectedDate} />

            {loading && <LoadingSpinner message="Fetching wind forecast & actuals from Elexon…" />}
            {!loading && error && <ErrorBanner message={error} />}
            {!loading && !error && data.length > 0 && (
              <>
                <ForecastChart
                  data={data}
                  selectedDate={selectedDate}
                  forecastPublishTime={forecastPublishTime}
                />

                {/* Procurement insight */}
                {peakForecast > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                    <strong>📌 Procurement Insight:</strong> The day-ahead forecast shows a peak of{' '}
                    <strong>{peakForecast.toFixed(0)} MW</strong> wind generation for this day.
                    Switch to the <strong>Accuracy Metrics</strong> tab to see the historical MAE
                    and recommended buffer procurement size.
                  </div>
                )}
              </>
            )}
            {!loading && !error && data.length === 0 && (
              <div className="card text-center py-10 text-gray-400">
                <Wind className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No data returned for this date.</p>
                <p className="text-xs mt-1">Try a different date or check the API is reachable.</p>
              </div>
            )}
          </>
        )}

        {/* ── ACCURACY TAB ────────────────────────────────────────────────── */}
        {activeTab === 'accuracy' && (
          <>
            {accLoading && (
              <LoadingSpinner message="Computing forecast accuracy across January 2026… (this may take up to 30s on cold start)" />
            )}
            {!accLoading && accError && <ErrorBanner message={accError} />}
            {!accLoading && !accError && metrics && (
              <AccuracyPanel metrics={metrics} />
            )}
          </>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span>GridBricks v1.0 · Built with React 19, FastAPI, and Elexon BMRS data</span>
          <span>AI-assisted development: Google Antigravity (Gemini/Claude)</span>
        </div>
      </footer>
    </div>
  );
}
