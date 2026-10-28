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
    <div className="card flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-gray-600">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Delivery Date</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(subDays(value, 1))}
          disabled={!canGoBack}
          className="btn btn-ghost p-1.5"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <input
          type="date"
          value={format(value, 'yyyy-MM-dd')}
          min={format(MIN_DATE, 'yyyy-MM-dd')}
          max={format(MAX_DATE, 'yyyy-MM-dd')}
          onChange={handleInputChange}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => onChange(addDays(value, 1))}
          disabled={!canGoForward}
          className="btn btn-ghost p-1.5"
          title="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400 ml-auto">
        Forecast = latest WINDFOR published before D-1 12:00 UTC (gate closure)
      </p>
    </div>
  );
}
