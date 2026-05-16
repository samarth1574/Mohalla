import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bell, BellRing, CheckCheck, MessageCircle, ShieldAlert, ShoppingBag, Users } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NotificationsClient } from "./notifications-client";

const notificationIcon = {
  NEW_MESSAGE: MessageCircle,
  COMMENT: MessageCircle,
  MENTION: MessageCircle,
  MARKETPLACE_INQUIRY: ShoppingBag,
  EVENT_REMINDER: Bell,
  EMERGENCY_ALERT: ShieldAlert,
  GROUP_ACTIVITY: Users,
};

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { locationId: true },
  });

  if (!user?.locationId) redirect("/onboarding");

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-left">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <BellRing className="h-3.5 w-3.5" />
            Community alerts
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Messages, emergency alerts, marketplace activity, event reminders, and group updates.
          </p>
        </div>
        <NotificationsClient unreadCount={unreadCount} mode="bulk" />
      </div>

      <div className="grid gap-3">
        {notifications.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-slate-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
            <Bell className="mx-auto mb-3 h-9 w-9 text-emerald-500/70" />
            <p className="text-sm font-bold">No notifications yet.</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Important local updates will appear here.
            </p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcon[notification.type] || Bell;
            const isEmergency = notification.type === "EMERGENCY_ALERT";

            return (
              <Card
                key={notification.id}
                className={`rounded-3xl border p-4 shadow-sm transition ${
                  notification.isRead
                    ? "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
                    : "border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isEmergency
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-black">{notification.title}</h2>
                      {!notification.isRead && (
                        <Badge className="bg-emerald-600 text-[9px] font-black text-white">New</Badge>
                      )}
                      {isEmergency && (
                        <Badge className="bg-red-500/10 text-[9px] font-black text-red-600 dark:text-red-400">
                          Priority
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-350">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                      {notification.type.replaceAll("_", " ")} • {notification.createdAt.toLocaleString("en-IN")}
                    </p>
                  </div>
                  {notification.isRead ? (
                    <CheckCheck className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                  ) : (
                    <NotificationsClient notificationId={notification.id} mode="single" />
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
