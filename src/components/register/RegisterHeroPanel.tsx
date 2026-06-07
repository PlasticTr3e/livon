import { Leaf } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { REGISTER_HERO_IMAGES } from "@/lib/register/register-copy";

type RegisterHeroPanelProps = {
  activeImageIndex: number;
};

export function RegisterHeroPanel({
  activeImageIndex,
}: RegisterHeroPanelProps) {
  const activeImage = REGISTER_HERO_IMAGES[activeImageIndex];

  return (
    <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-green-600 to-green-800 p-14 lg:flex lg:w-[55%]">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute right-10 top-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <span className="text-sm font-extrabold tracking-[0.18em] text-white">
          LIVON
        </span>
      </div>

      <div className="group relative h-72 w-72 overflow-hidden rounded-3xl border-4 border-white/30 shadow-2xl transition-all duration-700 hover:scale-105">
        <ImageWithFallback
          key={activeImageIndex}
          src={activeImage.src}
          alt={activeImage.alt}
          className="h-full w-full animate-fade-in object-cover"
        />
      </div>

      <div className="relative z-10 mt-8 text-center">
        <p className="max-w-xs text-xl font-bold leading-snug text-white">
          Make your neighborhood more
          <br />
          <span className="inline-block animate-pulse text-yellow-300">
            transparent & organized
          </span>
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {REGISTER_HERO_IMAGES.map((image, index) => (
            <div
              key={image.src}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === activeImageIndex
                  ? "w-4 bg-yellow-400"
                  : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
