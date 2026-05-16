"use client";

import { useTransition } from "react";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";

interface NotificationsClientProps {
  mode: "single" | "bulk";
  notificationId?: string;
  unreadCount?: number;
}

export function NotificationsClient({ mode, notificationId, unreadCount = 0 }: NotificationsClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      if (mode === "single" && notificationId) {
        await markNotificationReadAction(notificationId);
      }

      if (mode === "bulk") {
        await markAllNotificationsReadAction();
      }
    });
  };

  if (mode === "bulk") {
    return (
      <Button
        onClick={handleClick}
        disabled={isPending || unreadCount === 0}
        variant="outline"
        className="rounded-2xl border-slate-200 text-xs font-bold dark:border-zinc-800"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
        Mark all read ({unreadCount})
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      size="sm"
      variant="outline"
      className="rounded-full border-slate-200 px-3 text-[10px] font-bold dark:border-zinc-800"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
    </Button>
  );
}
