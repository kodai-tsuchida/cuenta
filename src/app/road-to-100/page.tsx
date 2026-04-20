"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, useAppStateSetter, newId } from "@/lib/store";
import {
  daysUntil,
  formatJPY,
  shortDate,
  todayIso,
} from "@/lib/format";
import type { RoadTo100Entry } from "@/lib/types";

export default function RoadTo100Page() {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<RoadTo100Entry, "id">>({
    name: "",
    amount: 0,
    expected: true,
    date: todayIso(),
    note: "",
  });

  const { actualTotal, plannedTotal, grandTotal, remaining, progress, days } =
    useMemo(() => {
      const actualTotal = state.roadTo100Entries
        .filter((e) => !e.expected)
        .reduce((s, e) => s + e.amount, 0);
      const plannedTotal = state.roadTo100Entries
        .filter((e) => e.expected)
        .reduce((s, e) => s + e.amount, 0);
      const grandTotal = actualTotal + plannedTotal;
      const remaining = Math.max(0, state.roadTo100Goal - grandTotal);
      const progress = Math.min(100, (grandTotal / state.roadTo100Goal) * 100);
      const days = daysUntil(state.roadTo100Deadline);
      return { actualTotal, plannedTotal, grandTotal, remaining, progress, days };
    }, [state.roadTo100Entries, state.roadTo100Goal, state.roadTo100Deadline]);

  const canAdd = draft.name.trim() && draft.amount > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        kicker="Rewards Challenge"
        title="Road to 100"
        description="AMEX プラチナで期限までに目標額(既定 100万円)を使うとボーナスポイント。確定した利用と、これから使う予定を合算してあと残りいくら必要かを表示します。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="目標"
          value={formatJPY(state.roadTo100Goal)}
          hint={`期限: ${state.roadTo100Deadline}`}
        />
        <StatCard
          label="確定 + 予定 合計"
          value={formatJPY(grandTotal)}
          hint={`確定 ${formatJPY(actualTotal)} / 予定 ${formatJPY(plannedTotal)}`}
          tone={grandTotal >= state.roadTo100Goal ? "positive" : "default"}
        />
        <StatCard
          label="あと必要"
          value={formatJPY(remaining)}
          tone={remaining === 0 ? "positive" : "warning"}
          hint={
            remaining === 0
              ? "達成予定です"
              : `${progress.toFixed(1)}% 到達`
          }
        />
        <StatCard
          label="期限まで"
          value={days >= 0 ? `あと ${days}日` : "期限切れ"}
          tone={days < 14 ? "warning" : "default"}
          hint={
            days > 0 && remaining > 0
              ? `1日あたり ${formatJPY(Math.ceil(remaining / days))} 必要`
              : undefined
          }
        />
      </section>

      <section className="mt-6 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold">進捗バー</h2>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-700 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatJPY(grandTotal)}</span>
          <span>{formatJPY(state.roadTo100Goal)}</span>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm sm:grid-cols-2">
        <label className="space-y-1">
          <span className="section-kicker">目標金額</span>
          <MoneyInput
            value={state.roadTo100Goal}
            onChange={(v) => set((s) => ({ ...s, roadTo100Goal: v }))}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">期限</span>
          <Input
            type="date"
            value={state.roadTo100Deadline}
            onChange={(e) =>
              set((s) => ({ ...s, roadTo100Deadline: e.currentTarget.value }))
            }
            className="font-mono"
          />
        </label>
      </section>

      <section className="mt-6 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              利用と予定の追加
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              すでに使った分は「確定」に、これから使う予定は「予定」に。両方合わせて目標に届くかが上の数字に反映されます。
            </p>
          </div>
        </div>
        <form
          className="mt-4 grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 md:grid-cols-[140px_1fr_140px_100px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAdd) return;
            set((s) => ({
              ...s,
              roadTo100Entries: [...s.roadTo100Entries, { id: newId(), ...draft }],
            }));
            setDraft({
              ...draft,
              name: "",
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
          <Input
            placeholder="名目(例: 旅行、家電購入、〇〇 に 19万円)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
          />
          <MoneyInput
            value={draft.amount}
            onChange={(v) => setDraft({ ...draft, amount: v })}
            placeholder="金額"
          />
          <Button
            type="button"
            variant={draft.expected ? "outline" : "default"}
            size="sm"
            onClick={() => setDraft({ ...draft, expected: !draft.expected })}
            className="justify-center"
          >
            {draft.expected ? "予定" : "確定"}
          </Button>
          <Button type="submit" size="sm" disabled={!canAdd}>
            <Plus className="size-3.5" />
            追加
          </Button>
        </form>

        <div className="mt-4 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">日付</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2">名目</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {[...state.roadTo100Entries]
                .sort((a, b) =>
                  (a.date ?? "").localeCompare(b.date ?? ""),
                )
                .map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-border/60 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {shortDate(entry.date)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          set((s) => ({
                            ...s,
                            roadTo100Entries: s.roadTo100Entries.map((e) =>
                              e.id === entry.id
                                ? { ...e, expected: !e.expected }
                                : e,
                            ),
                          }))
                        }
                        className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                          entry.expected
                            ? "bg-sky-100 text-sky-800 hover:bg-sky-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        {entry.expected ? "予定" : "確定"}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={entry.name}
                        onChange={(e) =>
                          set((s) => ({
                            ...s,
                            roadTo100Entries: s.roadTo100Entries.map((x) =>
                              x.id === entry.id
                                ? { ...x, name: e.currentTarget.value }
                                : x,
                            ),
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MoneyInput
                        value={entry.amount}
                        onChange={(v) =>
                          set((s) => ({
                            ...s,
                            roadTo100Entries: s.roadTo100Entries.map((x) =>
                              x.id === entry.id ? { ...x, amount: v } : x,
                            ),
                          }))
                        }
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          set((s) => ({
                            ...s,
                            roadTo100Entries: s.roadTo100Entries.filter(
                              (x) => x.id !== entry.id,
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
              {state.roadTo100Entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-xs text-muted-foreground"
                  >
                    まだ登録がありません。上のフォームから追加してください。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
