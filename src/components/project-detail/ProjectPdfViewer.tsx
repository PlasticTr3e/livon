"use client";

import { FileText, X } from "lucide-react";

type ProjectPdfViewerProps = {
  url: string;
  onClose: () => void;
};

export function ProjectPdfViewer({ url, onClose }: ProjectPdfViewerProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm md:p-10"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="flex items-center gap-2 font-bold text-gray-800">
            <FileText className="h-5 w-5 text-green-600" /> Document Viewer
          </h3>
          <button
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="w-full flex-1 bg-gray-100">
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
