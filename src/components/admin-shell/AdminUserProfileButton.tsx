import { cn } from "@/components/ui/primitives";
import {
  getUserHeaderDisplayName,
  getUserRoleLabel,
} from "@/lib/app-shell/user";

type AdminUserProfileButtonProps = {
  isActive: boolean;
  role: string;
  userName: string;
  onClick: () => void;
};

export function AdminUserProfileButton({
  isActive,
  role,
  userName,
  onClick,
}: AdminUserProfileButtonProps) {
  const displayName = getUserHeaderDisplayName(userName, role);
  const roleInitial = displayName.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ml-1 flex cursor-pointer items-center space-x-2 rounded-lg border-l border-gray-200 p-1.5 pl-3 transition-colors hover:bg-slate-100 dark:border-gray-800 dark:hover:bg-slate-800",
        isActive ? "bg-slate-100 dark:bg-[#1F2937]" : "",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-sm">
        {roleInitial}
      </div>
      <div className="hidden text-left text-sm md:block">
        <p className="font-semibold leading-tight text-gray-800 dark:text-white">
          {displayName}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          {getUserRoleLabel(role)}
        </p>
      </div>
    </button>
  );
}
