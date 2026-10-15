import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/components/ui/primitives";

type CommunityImageGridProps = {
  images: string[];
  title: string;
  onOpenImage: (index: number) => void;
};

const MAX_VISIBLE_IMAGES = 5;

const gridLayouts: Record<number, string> = {
  1: "aspect-[16/10] grid-rows-1",
  2: "aspect-[16/9] grid-cols-2 grid-rows-1",
  3: "aspect-[16/10] grid-cols-2 grid-rows-2",
  4: "aspect-[16/10] grid-cols-2 grid-rows-2",
  5: "grid-cols-4",
};

function getTileClassName(visibleCount: number, index: number) {
  if (visibleCount === 3 && index === 0) return "row-span-2";
  if (visibleCount === 5) {
    return index === 0 ? "col-span-4 aspect-[2/1]" : "aspect-square";
  }
  return "";
}

export function CommunityImageGrid({
  images,
  title,
  onOpenImage,
}: CommunityImageGridProps) {
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const hiddenCount = images.length - visibleImages.length;

  return (
    <div
      className={cn(
        "grid gap-1 overflow-hidden rounded-xl",
        gridLayouts[visibleImages.length],
      )}
    >
      {visibleImages.map((image, index) => {
        const isLastVisible = index === visibleImages.length - 1;

        return (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => onOpenImage(index)}
            aria-label={`Lihat foto ${index + 1} dari ${images.length}`}
            className={cn(
              "group relative min-h-0 overflow-hidden bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500 dark:bg-slate-800",
              getTileClassName(visibleImages.length, index),
            )}
          >
            <ImageWithFallback
              src={image}
              alt={`${title} (${index + 1})`}
              fill
              sizes="(min-width: 768px) 640px, 100vw"
              unoptimized={image.startsWith("blob:")}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            {isLastVisible && hiddenCount > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-bold text-white">
                +{hiddenCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
