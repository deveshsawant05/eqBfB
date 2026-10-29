import { format, addDays, subDays, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MIN_DATE = new Date('2026-01-01');
const MAX_DATE = new Date('2026-01-31');

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

export function DateSelector({ value, onChange }: Props) {
  const canGoBack = value > MIN_DATE;
  const canGoForward = value < MAX_DATE;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value);
    if (isValid(d) && d >= MIN_DATE && d <= MAX_DATE) {
      onChange(d);
    }
  };

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-4">
      {/* Date Stepper */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">Delivery Date:</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(subDays(value, 1))}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            min={format(MIN_DATE, 'yyyy-MM-dd')}
            max={format(MAX_DATE, 'yyyy-MM-dd')}
            onChange={handleInputChange}
            className="border border-slate-200 rounded-lg px-2.5 py-1 text-sm font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />

          <button
            onClick={() => onChange(addDays(value, 1))}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-sm font-medium text-slate-700 font-mono hidden sm:inline">
          {format(value, 'EEEE, d MMMM yyyy')}
        </span>
      </div>

      {/* Decision-time clarification note */}
      <div className="text-xs text-slate-500 font-mono">
        Showing latest forecast published before <span className="font-semibold text-slate-700">12:00 UTC (D-1)</span>
      </div>
    </div>
  );
}
