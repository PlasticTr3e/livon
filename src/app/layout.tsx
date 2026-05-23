import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider } from "../context/ThemeContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "Livon",
  description: "Livon civic platform",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <UserProvider>
          <ThemeProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
