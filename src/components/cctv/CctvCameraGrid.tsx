"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { MapPin, Play, VideoOff } from "lucide-react";
import type { CctvCamera } from "@/lib/cctv/cameras";
import { CctvPlayerDialog } from "./CctvPlayerDialog";

export function CctvCameraGrid({ cameras }: { cameras: CctvCamera[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedTrigger = useRef<HTMLButtonElement | null>(null);
  const selected = cameras.find((camera) => camera.id === selectedId);

  if (cameras.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-600 dark:text-gray-300">
        No cameras available yet.
      </p>
    );
  }

  return (
    <Dialog.Root
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) setSelectedId(null);
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Neighborhood cameras
        </h2>
        <span
          role="status"
          aria-atomic="true"
          className="text-xs text-gray-600 dark:text-gray-400"
        >
          {cameras.length} {cameras.length === 1 ? "camera" : "cameras"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
        {cameras.map((camera) => {
          const offline = camera.status === "offline" || !camera.source;
          return (
            <article
              key={camera.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111827]"
            >
              {offline ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <VideoOff aria-hidden="true" className="h-8 w-8" />
                  <p className="text-sm font-semibold">Camera offline</p>
                  <p className="text-xs">This sample feed is unavailable.</p>
                </div>
              ) : (
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    onClick={(event) => {
                      selectedTrigger.current = event.currentTarget;
                      setSelectedId(camera.id);
                    }}
                    aria-label={`Watch ${camera.name}`}
                    className="group relative block aspect-video w-full cursor-pointer overflow-hidden bg-slate-900 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-green-500"
                  >
                    <Image
                      src={camera.poster}
                      alt="Recorded street traffic demo"
                      fill
                      sizes="(min-width: 1152px) 540px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-85 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-xs font-semibold">
                      Demo recording
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-md bg-black/65 px-2 py-1 text-xs font-medium">
                      {camera.id.toUpperCase()}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-green-700 shadow-sm transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none">
                        <Play
                          aria-hidden="true"
                          className="ml-0.5 h-5 w-5"
                          fill="currentColor"
                        />
                      </span>
                    </span>
                  </button>
                </Dialog.Trigger>
              )}
              <div className="flex items-start justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {camera.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    {camera.location} · RT {camera.rt} / RW {camera.rw}
                  </p>
                </div>
                <span
                  className={
                    offline
                      ? "text-xs font-medium text-gray-600 dark:text-gray-400"
                      : "text-xs font-semibold text-green-700 dark:text-green-400"
                  }
                >
                  {offline ? "Offline" : "Demo"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      {selected && (
        <CctvPlayerDialog
          key={selected.id}
          camera={selected}
          onReturnFocus={() => selectedTrigger.current?.focus()}
        />
      )}
    </Dialog.Root>
  );
}
