/** Shared class strings so cards and buttons look identical across payment pages. */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 dark:focus-visible:ring-green-300 dark:focus-visible:ring-offset-slate-950";

export const primaryButtonClass = `flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-900 active:bg-green-950 disabled:cursor-not-allowed disabled:bg-slate-600 dark:disabled:bg-slate-700 ${focusRing}`;

export const outlineButtonClass = `flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-green-300 dark:hover:bg-slate-800 ${focusRing}`;

export const sectionCardClass =
  "rounded-2xl border border-green-100 bg-white p-5 shadow-sm md:p-7 dark:border-slate-800 dark:bg-slate-900";

export const greenPanelClass =
  "rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white shadow-md";

export const eyebrowClass = "text-xs font-bold uppercase tracking-widest";
