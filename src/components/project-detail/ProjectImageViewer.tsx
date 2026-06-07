"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/components/ui/primitives";

type ProjectImageViewerProps = {
  images: string[];
  imageIndex: number;
  projectName: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSelectImage: (index: number) => void;
};

export function ProjectImageViewer({
  images,
  imageIndex,
  projectName,
  onClose,
  onPrevious,
  onNext,
  onSelectImage,
}: ProjectImageViewerProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 z-[101] rounded-full bg-black/50 p-2 text-white/70 transition-colors hover:text-white"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="relative flex w-full max-w-5xl items-center px-4"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="absolute left-4 text-white/50 transition-colors hover:text-white md:-left-12"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-12 w-12" />
        </button>

        <div className="relative h-[80vh] w-full">
          <ImageWithFallback
            src={images[imageIndex]}
            alt={projectName}
            fill
            className="rounded-lg object-contain shadow-2xl"
          />
        </div>

        <button
          className="absolute right-4 text-white/50 transition-colors hover:text-white md:-right-12"
          onClick={onNext}
        >
          <ChevronRight className="h-12 w-12" />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            onClick={(event) => {
              event.stopPropagation();
              onSelectImage(index);
            }}
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-300",
              index === imageIndex
                ? "w-8 bg-white"
                : "bg-white/30 hover:bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
