"use client";

import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";

import { useSyncStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SyncIndicator({ className }: { className?: string }) {
  const status = useSyncStatus();

  let icon = <Cloud className="size-3.5" />;
  let text = "同期済み";
  let tone = "text-emerald-600";
  if (status.kind === "loading") {
    icon = <Loader2 className="size-3.5 animate-spin" />;
    text = "読込中…";
    tone = "text-muted-foreground";
  } else if (status.kind === "saving") {
    icon = <Loader2 className="size-3.5 animate-spin" />;
    text = "保存中…";
    tone = "text-blue-600";
  } else if (status.kind === "offline") {
    icon = <CloudOff className="size-3.5" />;
    text = "ローカルのみ";
    tone = "text-amber-600";
  } else if (status.kind === "error") {
    icon = <AlertCircle className="size-3.5" />;
    text = "同期エラー";
    tone = "text-rose-600";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        tone,
        className,
      )}
      title={status.kind === "error" ? status.message : undefined}
      data-mobile="keep"
    >
      {icon}
      {text}
    </span>
  );
}
