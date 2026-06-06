"use client";
import { Leaf, Clock, Wrench } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  features?: string[];
}

export function ComingSoon({
  title = "Segera Hadir",
  description = "Halaman ini sedang dalam pengembangan dan akan segera tersedia.",
  backHref,
  backLabel = "Kembali",
  features,
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950 px-6">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-200 dark:bg-green-900/20 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-200 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Logo + Icon */}
        <div className="relative mb-8">
          {/* Outer ring */}
          <div className="w-28 h-28 rounded-full border-4 border-green-200 dark:border-green-800 flex items-center justify-center">
            {/* Middle ring */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 dark:from-green-600 dark:to-green-800 flex items-center justify-center shadow-xl shadow-green-300/30 dark:shadow-green-900/50">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          {/* Wrench badge */}
          <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-sm">
            <Wrench className="w-4 h-4 text-yellow-900" />
          </div>
        </div>

        {/* LIVON label */}
        <div className="mb-3 flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-700">
          <span className="text-xs font-black tracking-widest text-green-700 dark:text-green-400 uppercase">
            LIVON
          </span>
          <span className="text-xs text-green-500 dark:text-green-500">
            Platform
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-white text-sm leading-relaxed mb-8">
          {description}
        </p>

        {/* Features list */}
        {features && features.length > 0 && (
          <div className="w-full mb-8 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm text-left space-y-3">
            <p className="text-xs font-bold text-gray-400 dark:text-white uppercase tracking-widest mb-4">
              Yang Akan Hadir
            </p>
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-white">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2 px-5 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl mb-6">
          <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
            Sedang dalam pengembangan aktif
          </span>
        </div>

        {/* Back button */}
        {backHref && (
          <Link
            href={backHref}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-semibold text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-sm shadow-green-200 dark:shadow-green-900"
          >
            ← {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
