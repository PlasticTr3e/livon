"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, Maximize, RotateCcw, VideoOff, X } from "lucide-react";
import type { CctvCamera } from "@/lib/cctv/cameras";
import styles from "./cctv.module.css";

export function CctvPlayerDialog({
  camera,
  onReturnFocus,
}: {
  camera: CctvCamera;
  onReturnFocus: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackState, setPlaybackState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [fullscreenError, setFullscreenError] = useState("");

  async function enterFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    setFullscreenError("");
    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else {
        const mobileVideo = video as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        };
        if (!mobileVideo.webkitEnterFullscreen)
          throw new Error("Fullscreen unavailable");
        mobileVideo.webkitEnterFullscreen();
      }
    } catch {
      setFullscreenError(
        "Fullscreen is unavailable in this browser. You can keep watching here.",
      );
    }
  }

  function retry() {
    setPlaybackState("loading");
    videoRef.current?.load();
    void videoRef.current?.play().catch(() => {
      // Native controls remain available if the browser requires another play gesture.
    });
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={`fixed inset-0 z-[2147483646] bg-black/65 ${styles.overlay}`}
      />
      <Dialog.Content
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
        className={`fixed left-1/2 top-1/2 z-[2147483647] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl outline-none dark:border-gray-700 dark:bg-[#111827] ${styles.dialog}`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <Dialog.Title className="truncate font-bold text-gray-900 dark:text-white">
              {camera.name}
            </Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              {camera.location} · RT {camera.rt} / RW {camera.rw} · Demo
              recording
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close camera"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 dark:text-gray-300 dark:hover:bg-slate-800"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </div>
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={camera.source}
            poster={camera.poster}
            controls
            autoPlay
            muted
            playsInline
            loop
            preload="metadata"
            aria-label={`${camera.name} demo recording`}
            className="h-full w-full object-contain"
            onCanPlay={() => setPlaybackState("ready")}
            onPlaying={() => setPlaybackState("ready")}
            onWaiting={() => setPlaybackState("loading")}
            onError={() => setPlaybackState("error")}
          />
          {playbackState === "loading" && (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-black/30 text-sm text-white"
            >
              <LoaderCircle
                aria-hidden="true"
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
              />
              Loading camera...
            </div>
          )}
          {playbackState === "error" && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-4 text-center text-white"
            >
              <VideoOff aria-hidden="true" className="h-8 w-8 text-slate-400" />
              <p className="text-sm">This camera could not be loaded.</p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Recorded demo footage · {camera.id.toUpperCase()}
          </p>
          <button
            type="button"
            onClick={() => void enterFullscreen()}
            disabled={playbackState === "error"}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            <Maximize aria-hidden="true" className="h-4 w-4" />
            Fullscreen
          </button>
        </div>
        {fullscreenError && (
          <p
            role="status"
            className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300"
          >
            {fullscreenError}
          </p>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
