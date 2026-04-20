"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<"input">, "onChange" | "value"> & {
  value: number;
  onChange: (value: number) => void;
};

/** 金額入力用の Input。空入力は 0 として扱う。 */
export function MoneyInput({ value, onChange, className, ...rest }: Props) {
  return (
    <Input
      inputMode="numeric"
      type="number"
      step={1}
      value={Number.isFinite(value) ? String(value) : ""}
      onChange={(event) => {
        const raw = event.currentTarget.value;
        const next = raw === "" ? 0 : Number(raw);
        if (Number.isFinite(next)) onChange(next);
      }}
      className={cn("font-mono tabular-nums", className)}
      {...rest}
    />
  );
}
