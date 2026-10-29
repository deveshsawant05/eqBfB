import { Wind } from 'lucide-react';

interface Props {
  message?: string;
}

export function LoadingSpinner({ message = 'Querying Elexon BMRS Stream API…' }: Props) {
  return (
    <div className="glass-card flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-slate-800 border-t-cyan-400 border-r-emerald-400 animate-spin" />
        <Wind className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-200">{message}</p>
        <p className="text-xs text-slate-400 font-mono">Fetching national GB wind actuals &amp; day-ahead forecasts</p>
      </div>
    </div>
  );
}
