import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { adminCardClass } from "./admin-billing-styles";

type AdminFormCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

/** Card with the green header band used by the admin input forms. */
export function AdminFormCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: AdminFormCardProps) {
  return (
    <section className={cn(adminCardClass, "flex flex-col", className)}>
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-4 text-white">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Icon aria-hidden="true" className="h-5 w-5" />
          {title}
        </h2>
        <p className="mt-1 text-xs text-green-50/90">{description}</p>
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  );
}
