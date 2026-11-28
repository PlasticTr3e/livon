import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { UserProvider } from "../context/UserContext";
import { ThemeProvider } from "../context/ThemeContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppToasterProvider } from "@/components/shared/AppToaster";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Livon",
  description: "Livon civic platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <UserProvider>
            <ThemeProvider>
              <AppToasterProvider>
                <NuqsAdapter>{children}</NuqsAdapter>
              </AppToasterProvider>
            </ThemeProvider>
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
