"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1704597037764-46c6ab679d3e?w=800&auto=format&fit=crop&q=80";

type ImageWithFallbackProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  onError,
  fill,
  width,
  height,
  ...imageProps
}: ImageWithFallbackProps) {
  const resolvedSrc = src || fallbackSrc;
  const [imageSrc, setImageSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImageSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <Image
      {...imageProps}
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : (width ?? 800)}
      height={fill ? undefined : (height ?? 800)}
      onError={(event) => {
        setImageSrc(fallbackSrc);
        onError?.(event);
      }}
      unoptimized={imageProps.unoptimized ?? true}
    />
  );
}
