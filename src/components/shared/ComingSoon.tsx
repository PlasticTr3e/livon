"use client";

import { Clock, Leaf, Wrench } from "lucide-react";
import Link from "next/link";

type ComingSoonProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  features?: string[];
};

export function ComingSoon({
  title = "Segera Hadir",
  description = "Halaman ini sedang dalam pengembangan dan akan segera tersedia.",
  backHref,
  backLabel = "Kembali",
  features = [],
}: ComingSoonProps) {
  const hasFeatures = features.length > 0;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-green-200 opacity-30 blur-3xl dark:bg-green-900/20" />
        <div
          className="absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse rounded-full bg-emerald-200 opacity-20 blur-3xl dark:bg-emerald-900/20"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-green-200 dark:border-green-800">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-xl shadow-green-300/30 dark:from-green-600 dark:to-green-800 dark:shadow-green-900/50">
              <Leaf className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-yellow-400 shadow-sm dark:border-slate-950">
            <Wrench className="h-4 w-4 text-yellow-900" />
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-full border border-green-200 bg-green-100 px-4 py-1.5 dark:border-green-700 dark:bg-green-900/30">
          <span className="text-xs font-black uppercase tracking-widest text-green-700 dark:text-green-400">
            LIVON
          </span>
          <span className="text-xs text-green-500 dark:text-green-500">
            Platform
          </span>
        </div>

        <h1 className="mb-3 text-4xl font-black leading-tight text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-white">
          {description}
        </p>

        {hasFeatures && (
          <div className="mb-8 w-full space-y-3 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white">
              Yang Akan Hadir
            </p>
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-100 dark:border-green-700 dark:bg-green-900/30">
                  <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-white">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-6 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <Clock className="h-4 w-4 shrink-0 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Sedang dalam pengembangan aktif
          </span>
        </div>

        {backHref && (
          <Link
            href={backHref}
            className="rounded-full bg-gradient-to-r from-green-600 to-green-700 px-8 py-3 text-sm font-semibold text-white shadow-sm shadow-green-200 transition-all hover:from-green-700 hover:to-green-800 dark:shadow-green-900"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
