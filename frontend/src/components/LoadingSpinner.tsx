interface Props {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading Elexon data…' }: Props) {
  return (
    <div className="panel flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 font-mono">Connecting to Elexon BMRS API</p>
    </div>
  );
}
