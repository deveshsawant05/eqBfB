import { format, addDays, subDays, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Compass, Sparkles } from 'lucide-react';

const MIN_DATE = new Date('2026-01-01');
const MAX_DATE = new Date('2026-01-31');

interface Props {
  value: Date;
  onChange: (d: Date) => void;
}

const PRESETS = [
  { label: 'Jan 10 · High Wind Peak', date: new Date('2026-01-10'), color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30' },
  { label: 'Jan 15 · Mid-Month', date: new Date('2026-01-15'), color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30' },
  { label: 'Jan 24 · Low Wind Margin', date: new Date('2026-01-24'), color: 'text-amber-400 border-amber-500/30 bg-amber-950/30' },
];

export function DateSelector({ value, onChange }: Props) {
  const canGoBack = value > MIN_DATE;
  const canGoForward = value < MAX_DATE;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value);
    if (isValid(d) && d >= MIN_DATE && d <= MAX_DATE) {
      onChange(d);
    }
  };

  const formattedDate = format(value, 'yyyy-MM-dd');

  return (
    <div className="glass-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-slate-300 mr-1">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Delivery Day</span>
              <p className="text-base font-semibold text-slate-100 font-mono leading-tight">
                {format(value, 'EEEE, d MMMM yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onChange(subDays(value, 1))}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Day (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={formattedDate}
              min={format(MIN_DATE, 'yyyy-MM-dd')}
              max={format(MAX_DATE, 'yyyy-MM-dd')}
              onChange={handleInputChange}
              className="bg-transparent border-0 text-slate-200 text-sm font-mono px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded cursor-pointer"
            />

            <button
              onClick={() => onChange(addDays(value, 1))}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Day (Arrow Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick jump scenario chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Key Scenarios:
          </span>
          {PRESETS.map((p) => {
            const isSelected = format(p.date, 'yyyy-MM-dd') === formattedDate;
            return (
              <button
                key={p.label}
                onClick={() => onChange(p.date)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${
                  p.color
                } ${isSelected ? 'ring-1 ring-cyan-400 font-bold scale-[1.02]' : 'hover:bg-slate-800/50 opacity-80 hover:opacity-100'}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Decision timeline indicator */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Decision Gate Closure:</span>
          <span className="font-mono text-cyan-300 font-medium">
            {format(subDays(value, 1), 'yyyy-MM-dd')} @ 12:00 UTC (D-1)
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Evaluation Horizon:</span>
          <span className="font-mono text-slate-300">48 Settlement Periods (30m cadence)</span>
        </div>
      </div>
    </div>
  );
}
