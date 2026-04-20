"use client";

import { usePathname } from "next/navigation";

import { SyncIndicator } from "@/components/sync-indicator";

const titles: Record<string, string> = {
  "/income": "収支",
  "/croslan": "CROSLAN",
  "/croslan/invoice": "CROSLAN 請求書",
  "/zou": "ゾウさん開発",
  "/road-to-100": "Road to 100",
};

function titleFor(pathname: string) {
  for (const path of Object.keys(titles).sort((a, b) => b.length - a.length)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return titles[path];
  }
  return "Cuenta";
}

export function MobileTopBar() {
  const pathname = usePathname();
  return (
    <div
      className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-sidebar/95 px-4 py-3 backdrop-blur-xl md:hidden print:hidden"
      data-mobile="keep"
    >
      <div className="flex items-center gap-2">
        <span className="section-kicker">Cuenta</span>
        <span className="font-heading text-sm font-semibold">
          {titleFor(pathname)}
        </span>
      </div>
      <SyncIndicator />
    </div>
  );
}
