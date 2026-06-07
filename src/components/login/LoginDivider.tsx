type LoginDividerProps = {
  label: string;
};

export function LoginDivider({ label }: LoginDividerProps) {
  return (
    <div className="my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
      <span className="whitespace-nowrap text-xs text-gray-400 dark:text-white">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}
