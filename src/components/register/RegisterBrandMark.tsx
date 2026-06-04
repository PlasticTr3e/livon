import { Leaf } from "lucide-react";

type RegisterBrandMarkProps = {
  className?: string;
};

export function RegisterBrandMark({ className = "" }: RegisterBrandMarkProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-green-700">
        <Leaf className="h-4 w-4 text-white" />
      </div>
      <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-sm font-bold tracking-widest text-transparent">
        LIVON
      </span>
    </div>
  );
}
