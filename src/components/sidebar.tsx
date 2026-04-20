"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarClock,
  Rocket,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  {
    href: "/income",
    label: "収支",
    description: "入出金・クレカ・銀行",
    icon: Wallet,
  },
  {
    href: "/time",
    label: "勤怠管理",
    description: "時給と稼働時間",
    icon: CalendarClock,
  },
  {
    href: "/business",
    label: "個人事業",
    description: "売上と経費",
    icon: BriefcaseBusiness,
  },
  {
    href: "/road-to-100",
    label: "Road to 100",
    description: "AMEX 100万円",
    icon: Rocket,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur-xl">
      <div className="px-5 pt-6 pb-5">
        <p className="section-kicker">Cuenta</p>
        <h1 className="mt-2 font-heading text-xl font-semibold leading-tight text-sidebar-foreground">
          個人ダッシュボード
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 translate-y-0.5",
                  active ? "opacity-100" : "opacity-70",
                )}
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold leading-snug">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    active
                      ? "text-sidebar-primary-foreground/80"
                      : "text-muted-foreground group-hover:text-sidebar-accent-foreground/80",
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-3 pb-5">
        <div className="rounded-xl bg-muted/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          データはこの端末のブラウザに保存されます。別の端末では別のデータになります。
        </div>
      </div>
    </aside>
  );
}
