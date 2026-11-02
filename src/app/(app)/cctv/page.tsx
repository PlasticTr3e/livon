import type { Metadata } from "next";
import { Cctv } from "lucide-react";
import { CctvBrowser } from "@/components/cctv/CctvBrowser";
import { cctvCameras } from "@/lib/cctv/cameras";

export const metadata: Metadata = {
  description: "Browse neighborhood cameras and open a larger camera view.",
};

export default function CctvPage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        <header className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
            <Cctv aria-hidden="true" className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white sm:text-3xl">
              CCTV
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              A closer look at your neighborhood. Select a camera to watch.
            </p>
          </div>
        </header>

        <CctvBrowser cameras={cctvCameras} />

        <p className="mt-6 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          Demo footage:{" "}
          <a
            className="underline underline-offset-2 hover:text-green-700 dark:hover:text-green-400"
            href="https://www.pexels.com/video/aerial-view-of-traffic-in-city-11331398/"
            target="_blank"
            rel="noreferrer"
          >
            Aerial View of Traffic in City
          </a>{" "}
          by Visual Standard Media, via Pexels.{" "}
          <a
            className="underline underline-offset-2 hover:text-green-700 dark:hover:text-green-400"
            href="https://www.pexels.com/license/"
            target="_blank"
            rel="noreferrer"
          >
            Pexels License
          </a>
          . Preview image resized; footage unchanged.
        </p>
      </div>
    </div>
  );
}
