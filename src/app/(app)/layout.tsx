"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Map,
  Newspaper,
  Settings,
  Leaf,
  HandCoins,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/components/ui/WireframePrimitives";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import AdminLayout from "../(admin)/layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole, userName } = useUser();
  const { theme, toggleTheme } = useTheme();

  // Jika route diawali /admin, pakai AdminLayout
  if (pathname.startsWith("/admin")) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  let navLinks;
  if (userRole === "Admin" || userRole === "Manager") {
    navLinks = [
      { name: "Management", href: "/admin/dashboard", icon: Settings },
      { name: "Map", href: "/map", icon: Map },
      { name: "Crowdfunding", href: "/crowdfunding", icon: HandCoins },
      { name: "News", href: "/news", icon: Newspaper },
    ];
  } else {
    navLinks = [
      { name: "Map", href: "/map", icon: Map },
      { name: "Crowdfunding", href: "/crowdfunding", icon: HandCoins },
      { name: "News", href: "/news", icon: Newspaper },
    ];
  }

  const roleInitial = userName.charAt(0).toUpperCase();
  const roleGradient =
    userRole === "Admin"
      ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900"
      : userRole === "Manager"
        ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
        : "bg-gradient-to-br from-green-500 to-green-700 text-white";

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950">
      <header className="flex-none bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 px-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-6">
          <Link
            href={userRole === "Admin" ? "/admin/dashboard" : "/map"}
            className="flex items-center space-x-2 group shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-green-300 dark:group-hover:shadow-green-900 transition-shadow">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              LIVON
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2",
                    isActive
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm shadow-green-200 dark:shadow-green-900"
                      : "text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400",
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={
              theme === "dark"
                ? "Beralih ke mode terang"
                : "Beralih ke mode gelap"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <div className="relative group">
            <button className="relative p-2 text-gray-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            </button>
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-xl hidden group-hover:block z-50">
              <div className="p-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 rounded-t-xl flex items-center justify-between">
                <p className="font-bold text-sm text-green-800 dark:text-green-300">
                  Notifikasi
                </p>
                <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                  3
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[
                  {
                    title: "Funding Dibuka",
                    desc: "Community Park Renovation kini terbuka untuk donasi.",
                    time: "2 jam lalu",
                    dot: "bg-yellow-400",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="p-3 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex gap-3"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {n.desc}
                      </p>
                      <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">
                        {n.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100 dark:border-slate-700 text-center text-xs text-green-600 dark:text-green-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer rounded-b-xl transition-colors">
                Lihat Semua Notifikasi
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/profile")}
            className={cn(
              "flex items-center space-x-2 border-l border-gray-200 dark:border-slate-700 pl-3 ml-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors",
              pathname === "/profile" ? "bg-slate-100 dark:bg-slate-800" : "",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
                roleGradient,
              )}
            >
              {roleInitial}
            </div>
            <div className="hidden md:block text-sm">
              <p className="font-semibold text-gray-800 dark:text-slate-200 leading-tight">
                {userName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
