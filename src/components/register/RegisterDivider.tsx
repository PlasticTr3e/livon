export function RegisterDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
      <span className="whitespace-nowrap text-xs text-gray-400">
        or continue with
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}
