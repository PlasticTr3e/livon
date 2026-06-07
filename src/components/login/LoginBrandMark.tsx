import { Leaf } from "lucide-react";

type LoginBrandMarkProps = {
  className?: string;
};

export function LoginBrandMark({ className = "" }: LoginBrandMarkProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br from-green-500 to-green-700 shadow-sm">
        <Leaf className="h-4 w-4 text-white" />
      </div>
      <span className="bg-linear-to-r from-green-600 to-green-800 bg-clip-text text-sm font-black tracking-widest text-transparent">
        LIVON
      </span>
    </div>
  );
}
