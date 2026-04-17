"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      className="bg-slate-900 text-white hover:bg-slate-800"
      onClick={() => window.print()}
    >
      印刷する
      <Printer className="size-4" />
    </Button>
  );
}
