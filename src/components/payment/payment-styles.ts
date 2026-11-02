/** Shared class strings so cards and buttons look identical across payment pages. */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950";

export const primaryButtonClass = `flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-black text-white shadow-md transition hover:bg-green-700 active:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700 ${focusRing}`;

export const outlineButtonClass = `flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-white text-sm font-black text-green-700 transition hover:border-green-400 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-900 dark:bg-slate-900 dark:text-green-400 dark:hover:bg-green-950/40 ${focusRing}`;

export const sectionCardClass =
  "rounded-2xl border border-green-100 bg-white p-5 shadow-sm md:p-7 dark:border-slate-800 dark:bg-slate-900";

export const greenPanelClass =
  "rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white shadow-md";

export const eyebrowClass = "text-xs font-bold uppercase tracking-widest";
