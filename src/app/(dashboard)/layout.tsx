import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AiAssistantWidget } from "@/components/ai-assistant";
import { 
  Home, 
  Building, 
  ShoppingBag, 
  FileText, 
  Search, 
  Map,
  MessageCircle,
  Briefcase, 
  MapPin, 
  Bell, 
  Users,
  AlertOctagon,
  HelpCircle,
  Bookmark
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor?: string;
  isEmergency?: boolean;
}

const navItems: NavItem[] = [
  { label: "Community Feed", href: "/feed", icon: Home },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Society Hub", href: "/societies", icon: Building },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Saved Items", href: "/saved", icon: Bookmark },
  { label: "Lost & Found", href: "/lost-found", icon: Search },
  { label: "Help Requests", href: "/requests", icon: HelpCircle },
  { label: "Jobs Board", href: "/jobs", icon: Briefcase },
  { label: "Map Heatmap", href: "/heatmap", icon: Map },
  { label: "Emergency SOS", href: "/emergency", icon: AlertOctagon, isEmergency: true },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Onboarding Guard
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      location: true,
      society: true,
    },
  });

  if (!user || !user.locationId) {
    redirect("/onboarding");
  }

  // Fetch unread notifications count
  const unreadCount = await db.notification.count({
    where: {
      userId: userId,
      isRead: false,
    },
  });

  const locationText = user.location 
    ? `${user.location.area}, ${user.location.city}` 
    : "Select Location";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 h-screen p-6 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-extrabold text-lg">M</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            Mohalla
          </span>
        </div>

        {/* Location Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-800/50 text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-6 truncate">
          <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="truncate">{locationText}</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isEmergency) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200 relative overflow-hidden group shadow-sm shadow-red-500/5"
                >
                  <span className="absolute inset-0 bg-red-500/5 animate-pulse rounded-xl" />
                  <Icon className="w-5 h-5 text-red-500 shrink-0 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/10 transition-all duration-200"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3 truncate">
            <UserButton />
            <div className="text-left truncate">
              <p className="text-xs font-bold dark:text-zinc-200 truncate">{user.name || "Neighbor"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.societyName || "General Area"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Navbar - Mobile and Tablet layout */}
      <header className="md:hidden flex h-14 items-center justify-between px-6 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            Mohalla
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-600 dark:text-zinc-300 max-w-[120px] truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{user.location?.area || "Location"}</span>
          </div>

          <Link href="/notifications" className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </Link>
          <UserButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto">
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile layout only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg flex items-center justify-around z-40 px-2 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isEmergency) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center p-2 rounded-full text-red-500 scale-110 relative shrink-0"
              >
                <div className="w-11 h-11 bg-red-500/10 dark:bg-red-500/20 rounded-full border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <Icon className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 py-1 px-3"
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-1 truncate max-w-[50px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Floating AI assistant bubble */}
      <AiAssistantWidget />

    </div>
  );
}
