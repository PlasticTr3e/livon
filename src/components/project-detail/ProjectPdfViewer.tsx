"use client";

import { FileText, X } from "lucide-react";

type ProjectPdfViewerProps = {
  url: string;
  onClose: () => void;
};

export function ProjectPdfViewer({ url, onClose }: ProjectPdfViewerProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4 md:p-10"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(86dvh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#111827] sm:h-[88dvh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#0B1120] sm:px-6 sm:py-4">
          <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-800 dark:text-white sm:text-base">
            <FileText className="h-5 w-5 text-green-600" /> Document Viewer
          </h3>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            onClick={onClose}
            aria-label="Close PDF viewer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 w-full flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950">
          <iframe
            src={`${url}#toolbar=0`}
            className="h-full w-full border-none"
            title="PDF Reader"
          />
        </div>
      </div>
    </div>
  );
}
