"use client";

import { useEffect, useState } from "react";
import { ProjectImageViewer } from "@/components/project-detail/ProjectImageViewer";
import type { CommunityLightboxState } from "@/lib/community/community-types";

type CommunityImageLightboxProps = {
  lightbox: CommunityLightboxState;
  onClose: () => void;
};

export function CommunityImageLightbox({
  lightbox,
  onClose,
}: CommunityImageLightboxProps) {
  const { images, title } = lightbox;
  const [imageIndex, setImageIndex] = useState(lightbox.index);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setImageIndex((current) => (current + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        setImageIndex(
          (current) => (current - 1 + images.length) % images.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  return (
    // Lifts the shared viewer above the app header and bottom navigation.
    <div className="relative z-[2147483646]">
      <ProjectImageViewer
        images={images}
        imageIndex={imageIndex}
        projectName={title}
        onClose={onClose}
        onPrevious={() =>
          setImageIndex(
            (current) => (current - 1 + images.length) % images.length,
          )
        }
        onNext={() => setImageIndex((current) => (current + 1) % images.length)}
        onSelectImage={setImageIndex}
      />
    </div>
  );
}
