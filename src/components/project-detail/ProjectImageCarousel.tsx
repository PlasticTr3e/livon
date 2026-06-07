"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/components/ui/primitives";

type ProjectImageCarouselProps = {
  images: string[];
  imageIndex: number;
  projectName: string;
  onOpenViewer: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function ProjectImageCarousel({
  images,
  imageIndex,
  projectName,
  onOpenViewer,
  onPrevious,
  onNext,
}: ProjectImageCarouselProps) {
  return (
    <div className="group relative h-64 w-full overflow-hidden rounded-2xl border border-green-100 bg-black shadow-sm md:h-80">
      <div
        className="flex h-full w-full cursor-pointer transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${imageIndex * 100}%)` }}
        onClick={onOpenViewer}
      >
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-full min-w-full">
            <ImageWithFallback
              src={src}
              alt={`${projectName} - Image ${index + 1}`}
              className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-full bg-black/50 p-3 text-white backdrop-blur-sm">
                <Maximize2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((src, index) => (
          <div
            key={`${src}-dot-${index}`}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              index === imageIndex ? "w-6 bg-white" : "bg-white/50",
            )}
          />
        ))}
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onPrevious();
        }}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
