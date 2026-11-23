import type { Metadata } from "next";
import { CctvBrowser } from "@/components/cctv/CctvBrowser";
import { cctvCameras } from "@/lib/cctv/cameras";

export const metadata: Metadata = {
  description: "Browse neighborhood cameras and open a larger camera view.",
};

export default function CctvPage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        <CctvBrowser cameras={cctvCameras} />
      </div>
    </div>
  );
}
