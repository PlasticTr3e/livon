import { cn } from "@/components/ui/primitives";
import {
  getUserAvatarClassName,
  getUserInitial,
  getUserRoleLabel,
} from "@/lib/app-shell/user";

type AppUserProfileButtonProps = {
  pathname: string;
  userName: string;
  userRole: string;
  onClick: () => void;
};

export function AppUserProfileButton({
  pathname,
  userName,
  userRole,
  onClick,
}: AppUserProfileButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ml-1 flex cursor-pointer items-center space-x-2 rounded-lg border-l border-gray-200 p-1.5 pl-3 transition-colors hover:bg-slate-100 dark:border-gray-800 dark:hover:bg-slate-800",
        pathname === "/profile" ? "bg-slate-100 dark:bg-[#1F2937]" : "",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm",
          getUserAvatarClassName(userRole),
        )}
      >
        {getUserInitial(userName)}
      </div>
      <div className="hidden text-left text-sm md:block">
        <p className="font-semibold leading-tight text-gray-800 dark:text-white">
          {userName}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          {getUserRoleLabel(userRole)}
        </p>
      </div>
    </button>
  );
}
