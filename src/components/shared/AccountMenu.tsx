"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui/primitives";
import { useLanguage } from "@/context/LanguageContext";
import {
  getUserAvatarClassName,
  getUserHeaderDisplayName,
  getUserInitial,
  getUserRoleLabel,
} from "@/lib/app-shell/user";
import { logoutSession } from "@/lib/auth-client";

const itemClass =
  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm font-medium outline-none";

export function AccountMenu({
  pathname,
  userName,
  userRole,
}: {
  pathname: string;
  userName: string;
  userRole: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const displayName = getUserHeaderDisplayName(userName, userRole);

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t("Account menu")}
          className={cn(
            "ml-1 flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border-l border-gray-200 p-1.5 pl-3 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-green-600 dark:border-gray-800 dark:hover:bg-slate-800",
            pathname === "/profile" && "bg-slate-100 dark:bg-slate-800",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 place-items-center rounded-full text-sm font-bold",
              getUserAvatarClassName(userRole),
            )}
          >
            {getUserInitial(displayName)}
          </span>
          <span className="hidden min-w-0 text-left md:block">
            <span className="block max-w-32 truncate text-sm font-semibold leading-tight text-gray-800 dark:text-white">
              {displayName}
            </span>
            <span className="block text-xs text-green-700 dark:text-green-400">
              {t(getUserRoleLabel(userRole))}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="hidden size-3.5 text-slate-500 md:block dark:text-slate-400"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-[2147483646] w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <DropdownMenu.Item
            onSelect={() => router.push("/profile")}
            className={cn(
              itemClass,
              "text-slate-800 data-[highlighted]:bg-slate-100 dark:text-slate-100 dark:data-[highlighted]:bg-slate-800",
            )}
          >
            <UserRound aria-hidden="true" className="size-4" />
            {t("My account")}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="mx-2 my-1 h-px bg-slate-200 dark:bg-slate-700" />
          <DropdownMenu.Item
            className={cn(
              itemClass,
              "text-red-700 data-[highlighted]:bg-red-50 dark:text-red-300 dark:data-[highlighted]:bg-red-950",
            )}
            onSelect={async () => {
              await logoutSession();
              window.location.replace("/auth/login");
            }}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {t("Logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
