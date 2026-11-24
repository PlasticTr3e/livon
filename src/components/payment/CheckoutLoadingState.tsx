/** Placeholder with the same shape as the review screen while bills load. */
export function CheckoutLoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-36 animate-pulse rounded-2xl bg-green-200/60 dark:bg-green-950" />
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
      <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
