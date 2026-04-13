"use client";
import React, { useState } from "react";
import Image from "next/image";

interface ImageWithFallbackProps {
  src: string;
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
  const [imgSrc, setImgSrc] = useState(src);

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
