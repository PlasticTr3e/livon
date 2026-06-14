"use client";

import { Download, ExternalLink, FileText, X } from "lucide-react";

type ProjectPdfViewerProps = {
  url: string;
  onClose: () => void;
};

export function ProjectPdfViewer({ url, onClose }: ProjectPdfViewerProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/80 px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+5.5rem)] backdrop-blur-sm md:px-10 md:pb-10 md:pt-[calc(env(safe-area-inset-top)+6rem)]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-7rem)] min-h-[360px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#111827] md:h-[calc(100dvh-env(safe-area-inset-top)-8.5rem)] md:min-h-0 md:max-h-none"
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
        <div className="flex min-h-0 w-full flex-1 flex-col bg-gray-100 dark:bg-slate-950">
          <MobileDocumentFallback url={url} />
          <iframe
            src={`${url}#toolbar=0`}
            className="hidden h-full w-full border-none md:block"
            title="PDF Reader"
          />
        </div>
      </div>
    </div>
  );
}

function MobileDocumentFallback({ url }: { url: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center md:hidden">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm dark:bg-[#111827]">
        <FileText className="h-8 w-8" />
      </div>
      <h4 className="text-base font-bold text-gray-900 dark:text-white">
        Open document in browser
      </h4>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500 dark:text-slate-300">
        Mobile browsers can block embedded document previews. Open the file in a
        new tab to view it safely.
      </p>
      <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-bold text-white transition-colors hover:bg-green-700"
        >
          <ExternalLink className="h-4 w-4" /> Open Document
        </a>
        <a
          href={url}
          download
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-[#111827] dark:text-white dark:hover:bg-slate-800"
        >
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
    </div>
  );
}
