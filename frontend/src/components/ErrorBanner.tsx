import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="panel border-amber-200 bg-amber-50/50 flex items-start gap-3 text-slate-800">
      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900">Notice</p>
        <p className="text-xs text-slate-600 mt-0.5 font-mono break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
}
