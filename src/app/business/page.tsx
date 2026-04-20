"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppState, useAppStateSetter, newId } from "@/lib/store";
import {
  currentMonthKey,
  formatJPY,
  formatMonthLabel,
  shortDate,
  todayIso,
} from "@/lib/format";
import type { BusinessTx } from "@/lib/types";

const expenseCategories = [
  "売上",
  "通信費",
  "旅費交通費",
  "ソフトウェア",
  "消耗品費",
  "新聞図書費",
  "外注費",
  "接待交際費",
  "広告宣伝費",
  "その他",
];

export default function BusinessPage() {
  const state = useAppState();
  const set = useAppStateSetter();

  const monthKey = currentMonthKey();

  const {
    monthIncome,
    monthExpense,
    monthProfit,
    byCategory,
    byMonth,
  } = useMemo(() => {
    const thisMonth = state.businessTx.filter((t) => t.date.startsWith(monthKey));
    const monthIncome = thisMonth
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0);
    const monthExpense = thisMonth
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const categoryMap = new Map<string, number>();
    for (const t of state.businessTx) {
      if (t.kind !== "expense") continue;
      categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
    }

    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const t of state.businessTx) {
      const key = t.date.slice(0, 7);
      const cur = monthMap.get(key) ?? { income: 0, expense: 0 };
      if (t.kind === "income") cur.income += t.amount;
      else cur.expense += t.amount;
      monthMap.set(key, cur);
    }

    return {
      monthIncome,
      monthExpense,
      monthProfit: monthIncome - monthExpense,
      byCategory: [...categoryMap.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      byMonth: [...monthMap.entries()]
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => b.month.localeCompare(a.month)),
    };
  }, [state.businessTx, monthKey]);

  const [draft, setDraft] = useState<Omit<BusinessTx, "id">>({
    date: todayIso(),
    title: "",
    counterparty: "",
    amount: 0,
    kind: "expense",
    category: "通信費",
    note: "",
  });

  const canAdd = draft.title.trim() && draft.amount > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="Business"
        title="個人事業"
        description="個人事業の売上と経費をここに記録。月別・勘定科目別の集計は確定申告のときにそのまま使えます。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={`${formatMonthLabel(monthKey)} 売上`}
          value={formatJPY(monthIncome)}
          tone="positive"
        />
        <StatCard
          label={`${formatMonthLabel(monthKey)} 経費`}
          value={formatJPY(monthExpense)}
          tone="warning"
        />
        <StatCard
          label={`${formatMonthLabel(monthKey)} 利益`}
          value={formatJPY(monthProfit)}
          tone={monthProfit < 0 ? "negative" : "default"}
        />
      </section>

      <section className="mt-6 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">売上・経費の登録</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              1件ずつ入力すると、そのまま月別と科目別に集計されます。
            </p>
          </div>
        </div>
        <form
          className="mt-4 grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 md:grid-cols-[140px_120px_1fr_140px_140px_120px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAdd) return;
            set((s) => ({
              ...s,
              businessTx: [...s.businessTx, { id: newId(), ...draft }],
            }));
            setDraft({
              ...draft,
              title: "",
              amount: 0,
              note: "",
              date: todayIso(),
            });
          }}
        >
          <Input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.currentTarget.value })}
            className="font-mono"
          />
          <Select
            value={draft.kind}
            onValueChange={(v) => {
              if (!v) return;
              setDraft({
                ...draft,
                kind: v as "income" | "expense",
                category: v === "income" ? "売上" : draft.category,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">売上</SelectItem>
              <SelectItem value="expense">経費</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="内容"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.currentTarget.value })}
          />
          <Input
            placeholder="取引先(任意)"
            value={draft.counterparty ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, counterparty: e.currentTarget.value })
            }
          />
          <MoneyInput
            value={draft.amount}
            onChange={(v) => setDraft({ ...draft, amount: v })}
            placeholder="金額"
          />
          <Select
            value={draft.category}
            onValueChange={(v) => {
              if (!v) return;
              setDraft({ ...draft, category: v });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={!canAdd}>
            <Plus className="size-3.5" />
            追加
          </Button>
        </form>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border/60 bg-card/70 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="font-heading text-base font-semibold">取引一覧</h3>
            <span className="text-xs text-muted-foreground">
              {state.businessTx.length} 件
            </span>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">日付</th>
                  <th className="px-3 py-2">区分</th>
                  <th className="px-3 py-2">内容</th>
                  <th className="px-3 py-2">科目</th>
                  <th className="px-3 py-2 text-right">金額</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...state.businessTx]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-border/60 hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {shortDate(t.date)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${
                            t.kind === "income"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {t.kind === "income" ? "売上" : "経費"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{t.title}</p>
                        {t.counterparty ? (
                          <p className="text-[11px] text-muted-foreground">
                            {t.counterparty}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs">{t.category}</td>
                      <td
                        className={`px-3 py-2 text-right font-mono tabular-nums ${
                          t.kind === "income" ? "text-emerald-600" : ""
                        }`}
                      >
                        {t.kind === "income" ? "+" : "-"}
                        {formatJPY(t.amount)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            set((s) => ({
                              ...s,
                              businessTx: s.businessTx.filter(
                                (x) => x.id !== t.id,
                              ),
                            }))
                          }
                          aria-label="削除"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                {state.businessTx.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-xs text-muted-foreground"
                    >
                      まだ取引がありません。上のフォームから追加してください。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold">月別の推移</h3>
            <ul className="mt-3 space-y-2">
              {byMonth.map((m) => (
                <li
                  key={m.month}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs">{m.month}</span>
                  <span className="flex gap-3 text-xs">
                    <span className="text-emerald-600 tabular-nums">
                      +{formatJPY(m.income)}
                    </span>
                    <span className="text-rose-600 tabular-nums">
                      -{formatJPY(m.expense)}
                    </span>
                  </span>
                </li>
              ))}
              {byMonth.length === 0 ? (
                <li className="text-center text-xs text-muted-foreground">
                  データがありません
                </li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-heading text-base font-semibold">科目別の経費</h3>
            <ul className="mt-3 space-y-2">
              {byCategory.map((c) => (
                <li
                  key={c.category}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span>{c.category}</span>
                  <span className="font-mono tabular-nums">
                    {formatJPY(c.amount)}
                  </span>
                </li>
              ))}
              {byCategory.length === 0 ? (
                <li className="text-center text-xs text-muted-foreground">
                  データがありません
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
