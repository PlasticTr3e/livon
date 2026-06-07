import {
  BarChart2,
  DollarSign,
  FolderKanban,
  HandCoins,
  Map,
  MessageSquare,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavigationLink = {
  href: string;
  icon: LucideIcon;
  matchPrefix?: string;
  name: string;
};

export const adminSidebarLinks: AdminNavigationLink[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: BarChart2 },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Crowdfunding", href: "/admin/crowdfunding", icon: DollarSign },
  { name: "Comments", href: "/admin/comments", icon: MessageSquare },
  { name: "News", href: "/admin/news", icon: Newspaper },
  { name: "Users", href: "/admin/users", icon: Users },
];

export const adminTopNavigationLinks: AdminNavigationLink[] = [
  {
    name: "Management",
    href: "/admin/dashboard",
    icon: Settings,
    matchPrefix: "/admin",
  },
  { name: "Map & Projects", href: "/map", icon: Map, matchPrefix: "/map" },
  {
    name: "Crowdfunding",
    href: "/crowdfunding",
    icon: HandCoins,
    matchPrefix: "/crowdfunding",
  },
  { name: "News", href: "/news", icon: Newspaper, matchPrefix: "/news" },
];

export function isAdminTopNavigationActive(
  pathname: string,
  link: AdminNavigationLink,
) {
  if (link.name === "Management") {
    return pathname.startsWith("/admin");
  }

  return pathname.startsWith(link.matchPrefix || link.href);
}

export function isAdminSidebarLinkActive(
  pathname: string,
  link: AdminNavigationLink,
) {
  return (
    pathname === link.href ||
    (link.href !== "/admin/dashboard" &&
      pathname.startsWith(`${link.href}/`)) ||
    (link.href === "/admin/projects" && pathname.startsWith("/admin/projects"))
  );
}
