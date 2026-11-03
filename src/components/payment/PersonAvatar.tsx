import { cn } from "@/components/ui/primitives";

type PersonAvatarProps = {
  name: string;
  anonymous?: boolean;
  className?: string;
};

export function PersonAvatar({
  name,
  anonymous,
  className,
}: PersonAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300",
        className,
      )}
    >
      {anonymous ? "?" : name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
