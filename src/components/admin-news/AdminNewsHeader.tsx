import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";

type AdminNewsHeaderProps = {
  onCreate: () => void;
};

export function AdminNewsHeader({ onCreate }: AdminNewsHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          News Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Publish community announcements and updates.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={onCreate}
        className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-6 text-xs font-bold shadow-sm hover:bg-green-700"
      >
        <Plus className="h-4 w-4" />
        <span>New News</span>
      </Button>
    </div>
  );
}
