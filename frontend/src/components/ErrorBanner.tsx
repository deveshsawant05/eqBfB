import { AlertTriangle } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Error loading data</p>
        <p className="text-sm text-red-700 mt-0.5 break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-ghost text-red-700 hover:bg-red-100 flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
