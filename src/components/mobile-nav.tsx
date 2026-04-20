"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Rocket,
  Sparkles,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/income", label: "収支", icon: Wallet },
  { href: "/croslan", label: "CROSLAN", icon: Building2 },
  { href: "/zou", label: "ゾウ", icon: Sparkles },
  { href: "/road-to-100", label: "100", icon: Rocket },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/60 bg-sidebar/95 backdrop-blur-xl print:hidden md:hidden"
      data-mobile="keep"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-mobile="keep"
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              active
                ? "text-sidebar-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
