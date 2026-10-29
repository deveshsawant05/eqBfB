import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="glass-card border-rose-500/30 bg-rose-950/20 flex items-start gap-3 text-slate-200">
      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-rose-300">Data Feed Alert</p>
        <p className="text-xs text-rose-200/80 mt-0.5 break-words font-mono">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Query
        </button>
      )}
    </div>
  );
}
