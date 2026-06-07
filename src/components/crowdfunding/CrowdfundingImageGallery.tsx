"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

type CrowdfundingImageGalleryProps = {
  images: string[];
  title: string;
};

export function CrowdfundingImageGallery({
  images,
  title,
}: CrowdfundingImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  function showNextImage() {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }

  function showPreviousImage() {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  return (
    <div className="group relative h-64 w-full overflow-hidden rounded-2xl shadow-md md:col-span-2 md:h-[340px]">
      <ImageWithFallback
        src={images[currentImageIndex]}
        alt={title}
        className="h-full w-full object-cover transition-all duration-500"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPreviousImage}
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={showNextImage}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  index === currentImageIndex
                    ? "scale-125 bg-white"
                    : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
