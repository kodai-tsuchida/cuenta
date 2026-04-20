import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="section-kicker">{kicker}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-rose-600"
        : tone === "warning"
          ? "text-amber-600"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur">
      <p className="section-kicker">{label}</p>
      <p className={`mt-3 font-heading text-3xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
