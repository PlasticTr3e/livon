"use client";
import React, { useState } from "react"; // Hapus useEffect dari import
import Image from "next/image";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  fallback?: string;
  className?: string;
}

export function ImageWithFallback({
  src,
  alt,
  fallback = "https://images.unsplash.com/photo-1704597037764-46c6ab679d3e?w=800&auto=format&fit=crop&q=80",
  className,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [prevSrc, setPrevSrc] = useState(src);

  // Ini adalah cara "Halal" di React modern untuk mereset state
  // ketika props (src) berubah dari luar, tanpa memicu cascading renders.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src || fallback);
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={800}
      height={800}
      className={className}
      onError={() => setImgSrc(fallback)}
      unoptimized
    />
  );
}
