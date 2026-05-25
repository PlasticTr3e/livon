"use client";
import React, { useState } from "react"; // Hapus useEffect dari import
import Image from "next/image";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  fallback?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

export function ImageWithFallback({
  src,
  alt,
  fallback = "https://images.unsplash.com/photo-1704597037764-46c6ab679d3e?w=800&auto=format&fit=crop&q=80",
  className,
  fill,
  width,
  height,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src || fallback);
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width || 800 : undefined}
      height={!fill ? height || 800 : undefined}
      className={className}
      onError={() => setImgSrc(fallback)}
      unoptimized
    />
  );
}
