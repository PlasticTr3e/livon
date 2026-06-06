import type { LucideIcon } from "lucide-react";
import { HandCoins, Map, Newspaper, Settings } from "lucide-react";

export type AppNavLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const residentNavLinks: AppNavLink[] = [
  { name: "Map & Projects", href: "/map", icon: Map },
  { name: "Crowdfunding", href: "/crowdfunding", icon: HandCoins },
  { name: "News", href: "/news", icon: Newspaper },
];

const agencyNavLinks: AppNavLink[] = [
  { name: "Management", href: "/admin/dashboard", icon: Settings },
  ...residentNavLinks,
];

export function getAppNavLinks(userRole: string) {
  return userRole === "agency" ? agencyNavLinks : residentNavLinks;
}

export function getHomeHref(userRole: string) {
  return userRole === "agency" ? "/admin/dashboard" : "/map";
}

export function canToggleRouteSidebar(pathname: string) {
  return pathname === "/map" || pathname === "/profile";
}
