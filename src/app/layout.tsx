import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mohalla | India's Neighborhood Social Network",
  description: "Connect with neighbors, find local events, buy & sell locally, discover trusted local service providers, and get emergency help in your society.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mohalla",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="theme-color" content="#059669" />
        </head>
        <body
          className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200"
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <PwaRegister />
            <PwaInstallBanner />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
