"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, useAppStateSetter, newId } from "@/lib/store";
import {
  currentMonthKey,
  formatJPY,
  formatHours,
  formatMonthLabel,
  minutesBetween,
  prevMonthKey,
  shortDate,
  todayIso,
} from "@/lib/format";
import type { TimeEntry } from "@/lib/types";

export default function TimePage() {
  const state = useAppState();
  const set = useAppStateSetter();

  const monthKey = currentMonthKey();
  const prevKey = prevMonthKey(monthKey);

  const { thisMonthMinutes, lastMonthMinutes, thisMonthPay, lastMonthPay } =
    useMemo(() => {
      const calc = (key: string) =>
        state.timeEntries
          .filter((e) => e.date.startsWith(key))
          .reduce((sum, e) => sum + minutesBetween(e.start, e.end), 0);
      const thisMonthMinutes = calc(monthKey);
      const lastMonthMinutes = calc(prevKey);
      return {
        thisMonthMinutes,
        lastMonthMinutes,
        thisMonthPay: Math.round((thisMonthMinutes / 60) * state.hourlyRate),
        lastMonthPay: Math.round((lastMonthMinutes / 60) * state.hourlyRate),
      };
    }, [state.timeEntries, state.hourlyRate, monthKey, prevKey]);

  const [draft, setDraft] = useState<Omit<TimeEntry, "id">>({
    date: todayIso(),
    start: "09:00",
    end: "18:00",
    work: "",
    client: "",
  });

  const draftMinutes = minutesBetween(draft.start, draft.end);

  const sortedEntries = useMemo(
    () => [...state.timeEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [state.timeEntries],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="Time Tracking"
        title="勤怠管理"
        description="稼働時間を入力すると、時給と掛け合わせた給与予定が収支ページに自動反映されます。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="時給"
          value={formatJPY(state.hourlyRate)}
          hint="下の入力で変更できます"
        />
        <StatCard
          label={`${formatMonthLabel(monthKey)} 稼働時間`}
          value={formatHours(thisMonthMinutes)}
        />
        <StatCard
          label={`${formatMonthLabel(monthKey)} 給与予定`}
          value={formatJPY(thisMonthPay)}
          tone="positive"
          hint={`翌月${state.salaryPayDay}日入金`}
        />
        <StatCard
          label={`${formatMonthLabel(prevKey)} 分`}
          value={formatJPY(lastMonthPay)}
          hint={formatHours(lastMonthMinutes)}
        />
      </section>

      <section className="mt-6 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <h2 className="font-heading text-lg font-semibold">時給と支払日</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          設定した時給と支払日は、収支ページの「今月の給与予定」にそのまま反映されます。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="section-kicker">時給(円)</span>
            <MoneyInput
              value={state.hourlyRate}
              onChange={(v) => set((s) => ({ ...s, hourlyRate: v }))}
            />
          </label>
          <label className="space-y-1">
            <span className="section-kicker">給与の支払日(毎月)</span>
            <Input
              type="number"
              min={1}
              max={31}
              value={state.salaryPayDay}
              onChange={(e) =>
                set((s) => ({
                  ...s,
                  salaryPayDay: Math.max(
                    1,
                    Math.min(31, Number(e.currentTarget.value) || 1),
                  ),
                }))
              }
              className="font-mono"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">稼働の記録</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              日付・開始・終了を入れると、稼働時間と給与が自動計算されます。
            </p>
          </div>
        </div>

        <form
          className="mt-4 grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 md:grid-cols-[140px_100px_100px_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (draftMinutes <= 0) return;
            set((s) => ({
              ...s,
              timeEntries: [...s.timeEntries, { id: newId(), ...draft }],
            }));
            setDraft({
              ...draft,
              date: todayIso(),
              work: "",
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
            type="time"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.currentTarget.value })}
            className="font-mono"
          />
          <Input
            type="time"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.currentTarget.value })}
            className="font-mono"
          />
          <Input
            placeholder="クライアント(任意)"
            value={draft.client ?? ""}
            onChange={(e) => setDraft({ ...draft, client: e.currentTarget.value })}
          />
          <Input
            placeholder="作業内容(任意)"
            value={draft.work ?? ""}
            onChange={(e) => setDraft({ ...draft, work: e.currentTarget.value })}
          />
          <Button type="submit" size="sm" disabled={draftMinutes <= 0}>
            <Plus className="size-3.5" />
            追加
            <span className="ml-1 text-[11px] text-muted-foreground">
              {draftMinutes > 0 ? formatHours(draftMinutes) : ""}
            </span>
          </Button>
        </form>

        <div className="mt-4 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">日付</th>
                <th className="px-3 py-2">時間帯</th>
                <th className="px-3 py-2">クライアント</th>
                <th className="px-3 py-2">作業内容</th>
                <th className="px-3 py-2 text-right">稼働</th>
                <th className="px-3 py-2 text-right">給与換算</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => {
                const mins = minutesBetween(entry.start, entry.end);
                const pay = Math.round((mins / 60) * state.hourlyRate);
                return (
                  <tr
                    key={entry.id}
                    className="border-t border-border/60 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {shortDate(entry.date)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {entry.start} - {entry.end}
                    </td>
                    <td className="px-3 py-2">{entry.client}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.work}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {formatHours(mins)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-600">
                      {formatJPY(pay)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          set((s) => ({
                            ...s,
                            timeEntries: s.timeEntries.filter(
                              (t) => t.id !== entry.id,
                            ),
                          }))
                        }
                        aria-label="削除"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {sortedEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-xs text-muted-foreground"
                  >
                    まだ記録がありません。上のフォームから追加してください。
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
