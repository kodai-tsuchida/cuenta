"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newId, useAppState, useAppStateSetter } from "@/lib/store";
import {
  buildCalendar,
  isWeekday,
  nextMonth as nextMonthKeyFn,
  prevMonth as prevMonthKeyFn,
  WEEKDAYS,
} from "@/lib/calendar";
import {
  currentMonthKey,
  formatHours,
  formatJPY,
  formatMonthLabel,
  minutesBetween,
  todayIso,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CommuteRoute, CroslanExpense, TimeEntry } from "@/lib/types";

function totalWorkedMinutes(entry: TimeEntry) {
  const raw = minutesBetween(entry.start, entry.end);
  return Math.max(0, raw - (entry.breakMinutes || 0));
}

export default function CroslanPage() {
  const state = useAppState();
  const set = useAppStateSetter();

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildCalendar(monthKey), [monthKey]);
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    for (const e of state.timeEntries) map.set(e.date, e);
    return map;
  }, [state.timeEntries]);

  // 月の合計
  const monthEntries = state.timeEntries.filter((e) =>
    e.date.startsWith(monthKey),
  );
  const totalMinutes = monthEntries.reduce(
    (sum, e) => sum + totalWorkedMinutes(e),
    0,
  );
  const workHours = totalMinutes / 60;
  const salary = Math.round(workHours * state.hourlyRate);
  const workDays = monthEntries.filter((e) => totalWorkedMinutes(e) > 0).length;
  const defaultRoute =
    state.commuteRoutes.find((r) => r.isDefault) ?? state.commuteRoutes[0];
  const transportAuto = defaultRoute
    ? workDays * defaultRoute.roundTripFare
    : 0;
  const monthExpenses = state.croslanExpenses
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        kicker="CROSLAN"
        title="CROSLAN 勤怠・経費"
        description="カレンダーで勤務時刻を入れると、月の労働時間・支給額・交通費が自動で合算されます。請求書もこの画面から発行できます。"
        action={
          <>
            <Link
              href={`/croslan/invoice?month=${monthKey}`}
              data-mobile="hide"
            >
              <Button size="sm">
                <FileText className="size-3.5" />
                今月の請求書
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="月の労働時間"
          value={formatHours(totalMinutes)}
          hint={`勤務日 ${workDays}日 / ${workHours.toFixed(2)}h`}
        />
        <StatCard
          label="支給額(税抜)"
          value={formatJPY(salary)}
          hint={`時給 ${formatJPY(state.hourlyRate)} × ${workHours.toFixed(2)}h`}
          tone="positive"
        />
        <StatCard
          label="交通費(自動)"
          value={formatJPY(transportAuto)}
          hint={
            defaultRoute
              ? `${defaultRoute.name} 往復 ${formatJPY(
                  defaultRoute.roundTripFare,
                )} × ${workDays}日`
              : "路線を登録してください"
          }
        />
        <StatCard
          label="会社経費"
          value={formatJPY(monthExpenses)}
          hint="下の経費欄から登録"
        />
      </section>

      {/* --------------------------- カレンダー --------------------------- */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonthKey(prevMonthKeyFn(monthKey))}
              aria-label="前月"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <CalendarDays className="size-4 text-muted-foreground" />
              {formatMonthLabel(monthKey)}
            </h2>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonthKey(nextMonthKeyFn(monthKey))}
              aria-label="翌月"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMonthKey(currentMonthKey())}
            >
              今月
            </Button>
          </div>
          <BulkInput
            monthKey={monthKey}
            onBulkApplied={() => setSelected(null)}
          />
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-xs">
          {WEEKDAYS.map((w, idx) => (
            <div
              key={w}
              className={cn(
                "py-1 text-center font-medium",
                idx === 0 && "text-rose-600",
                idx === 6 && "text-sky-600",
              )}
            >
              {w}
            </div>
          ))}
          {cells.map((c) => {
            const entry = entriesByDate.get(c.date);
            const mins = entry ? totalWorkedMinutes(entry) : 0;
            const isSel = selected === c.date;
            const isToday = c.date === todayIso();
            return (
              <button
                type="button"
                key={c.date}
                onClick={() => setSelected(c.date)}
                className={cn(
                  "min-h-[82px] rounded-lg border border-border/50 bg-background/60 px-2 py-1.5 text-left transition-colors hover:border-primary/60",
                  c.outside && "opacity-40",
                  isSel && "border-primary ring-2 ring-primary/30",
                  isToday && !isSel && "border-primary/60",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      c.weekday === 0 && "text-rose-600",
                      c.weekday === 6 && "text-sky-600",
                    )}
                  >
                    {c.day}
                  </span>
                  {entry && mins > 0 ? (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {entry.workType ?? ""}
                    </span>
                  ) : null}
                </div>
                {entry && mins > 0 ? (
                  <>
                    <p className="mt-1 font-mono text-[11px] leading-tight">
                      {entry.start}〜{entry.end}
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-primary">
                      {formatHours(mins)}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    —
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* 選択中の日の編集 */}
        {selected ? (
          <DayEditor
            key={selected}
            date={selected}
            entry={entriesByDate.get(selected)}
            onDone={() => setSelected(null)}
            outside={
              !cells.some((c) => c.date === selected && !c.outside)
            }
          />
        ) : (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            日付をクリックすると、その日の勤務を入力できます。一斉入力は右上のボタンから。
          </p>
        )}
      </section>

      {/* --------------------------- 交通費 --------------------------- */}
      <section className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-semibold">交通費</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              出勤日数 × 往復運賃 で自動計算します。路線を追加すれば合計も足されます。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set((s) => ({
                ...s,
                commuteRoutes: [
                  ...s.commuteRoutes,
                  {
                    id: newId(),
                    name: "新しい路線",
                    roundTripFare: 0,
                  },
                ],
              }))
            }
          >
            <Plus className="size-3.5" />
            路線を追加
          </Button>
        </div>

        <ul className="mt-4 space-y-2">
          {state.commuteRoutes.map((route) => (
            <RouteRow
              key={route.id}
              route={route}
              workDays={workDays}
              onChange={(next) =>
                set((s) => ({
                  ...s,
                  commuteRoutes: s.commuteRoutes.map((r) =>
                    r.id === route.id ? next : r,
                  ),
                }))
              }
              onRemove={() =>
                set((s) => ({
                  ...s,
                  commuteRoutes: s.commuteRoutes.filter((r) => r.id !== route.id),
                }))
              }
              onSetDefault={() =>
                set((s) => ({
                  ...s,
                  commuteRoutes: s.commuteRoutes.map((r) => ({
                    ...r,
                    isDefault: r.id === route.id,
                  })),
                }))
              }
            />
          ))}
        </ul>
      </section>

      {/* --------------------------- 会社経費 --------------------------- */}
      <ExpensesPanel monthKey={monthKey} />
    </div>
  );
}

/* ------------------------------ BulkInput ------------------------------ */

function BulkInput({
  monthKey,
  onBulkApplied,
}: {
  monthKey: string;
  onBulkApplied: () => void;
}) {
  const state = useAppState();
  const set = useAppStateSetter();

  const [showEditor, setShowEditor] = useState(false);

  const applyWeekdays = () => {
    set((s) => {
      const cells = buildCalendar(monthKey);
      const existing = new Set(s.timeEntries.map((e) => e.date));
      const add: TimeEntry[] = [];
      for (const c of cells) {
        if (c.outside) continue;
        if (!isWeekday(c.weekday)) continue;
        if (existing.has(c.date)) continue;
        add.push({
          id: newId(),
          date: c.date,
          start: s.defaultStart,
          end: s.defaultEnd,
          breakMinutes: s.defaultBreakMinutes,
          workType: s.defaultWorkType,
        });
      }
      return { ...s, timeEntries: [...s.timeEntries, ...add] };
    });
    onBulkApplied();
  };

  const clearMonth = () => {
    if (
      !confirm(
        `${formatMonthLabel(monthKey)}の勤怠をすべて削除します。よろしいですか?`,
      )
    )
      return;
    set((s) => ({
      ...s,
      timeEntries: s.timeEntries.filter((e) => !e.date.startsWith(monthKey)),
    }));
    onBulkApplied();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowEditor((v) => !v)}
      >
        <Wand2 className="size-3.5" />
        一括入力
      </Button>
      <Button variant="ghost" size="sm" onClick={clearMonth}>
        <Trash2 className="size-3.5" />
        月を全消去
      </Button>
      {showEditor ? (
        <div className="ml-2 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">始業</span>
            <Input
              type="time"
              value={state.defaultStart}
              onChange={(e) =>
                set((s) => ({ ...s, defaultStart: e.currentTarget.value }))
              }
              className="h-7 w-24 font-mono"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">終業</span>
            <Input
              type="time"
              value={state.defaultEnd}
              onChange={(e) =>
                set((s) => ({ ...s, defaultEnd: e.currentTarget.value }))
              }
              className="h-7 w-24 font-mono"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">休憩(分)</span>
            <Input
              type="number"
              min={0}
              max={480}
              value={state.defaultBreakMinutes}
              onChange={(e) =>
                set((s) => ({
                  ...s,
                  defaultBreakMinutes: Math.max(
                    0,
                    Number(e.currentTarget.value) || 0,
                  ),
                }))
              }
              className="h-7 w-16 font-mono"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">勤務形態</span>
            <Input
              value={state.defaultWorkType}
              onChange={(e) =>
                set((s) => ({ ...s, defaultWorkType: e.currentTarget.value }))
              }
              className="h-7 w-28"
            />
          </label>
          <Button size="sm" onClick={applyWeekdays}>
            平日に反映
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------ DayEditor ------------------------------ */

function DayEditor({
  date,
  entry,
  onDone,
  outside,
}: {
  date: string;
  entry: TimeEntry | undefined;
  onDone: () => void;
  outside: boolean;
}) {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<TimeEntry, "id">>(() =>
    entry
      ? {
          date: entry.date,
          start: entry.start,
          end: entry.end,
          breakMinutes: entry.breakMinutes ?? 0,
          workType: entry.workType,
          note: entry.note,
        }
      : {
          date,
          start: state.defaultStart,
          end: state.defaultEnd,
          breakMinutes: state.defaultBreakMinutes,
          workType: state.defaultWorkType,
          note: "",
        },
  );

  // 対象日が変わったら draft を作り直す(再マウントで対応)
  // ここでは useEffect を使わず、keyed DayEditor にするか、新しいインスタンスが渡される前提。
  // 親 (CroslanPage) で selected が変わるたびに DayEditor が再マウントされるよう key を付ける
  // のが手堅いので、ここでは state は初期化時のみ。

  const mins = Math.max(
    0,
    minutesBetween(draft.start, draft.end) - (draft.breakMinutes || 0),
  );

  const save = () => {
    set((s) => {
      const others = s.timeEntries.filter((e) => e.date !== date);
      if (mins <= 0) return { ...s, timeEntries: others };
      const existing = s.timeEntries.find((e) => e.date === date);
      return {
        ...s,
        timeEntries: [
          ...others,
          {
            id: existing?.id ?? newId(),
            ...draft,
          },
        ],
      };
    });
    onDone();
  };

  const remove = () => {
    set((s) => ({
      ...s,
      timeEntries: s.timeEntries.filter((e) => e.date !== date),
    }));
    onDone();
  };

  return (
    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="section-kicker">選択中の日付</p>
          <p className="mt-1 font-mono text-base font-semibold">
            {date} {outside ? "(当月外)" : ""}
          </p>
        </div>
        <label className="space-y-1">
          <span className="section-kicker">始業</span>
          <Input
            type="time"
            value={draft.start}
            onChange={(e) =>
              setDraft({ ...draft, start: e.currentTarget.value })
            }
            className="h-8 w-28 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">終業</span>
          <Input
            type="time"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.currentTarget.value })}
            className="h-8 w-28 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">休憩(分)</span>
          <Input
            type="number"
            min={0}
            max={480}
            value={draft.breakMinutes}
            onChange={(e) =>
              setDraft({
                ...draft,
                breakMinutes: Math.max(0, Number(e.currentTarget.value) || 0),
              })
            }
            className="h-8 w-20 font-mono"
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">勤務形態</span>
          <Input
            value={draft.workType ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, workType: e.currentTarget.value })
            }
            className="h-8 w-36"
          />
        </label>
        <div className="space-y-1">
          <p className="section-kicker">合計</p>
          <p className="font-mono text-base font-semibold text-primary">
            {mins > 0 ? formatHours(mins) : "—"}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {entry ? (
            <Button variant="ghost" size="sm" onClick={remove}>
              <Trash2 className="size-3.5" />
              削除
            </Button>
          ) : null}
          <Button size="sm" onClick={save}>
            保存
          </Button>
          <Button variant="outline" size="sm" onClick={onDone}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ RouteRow ------------------------------- */

function RouteRow({
  route,
  workDays,
  onChange,
  onRemove,
  onSetDefault,
}: {
  route: CommuteRoute;
  workDays: number;
  onChange: (next: CommuteRoute) => void;
  onRemove: () => void;
  onSetDefault: () => void;
}) {
  const fare = route.roundTripFare || 0;
  const total = route.isDefault ? fare * workDays : 0;
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2">
      <Button
        variant={route.isDefault ? "default" : "outline"}
        size="sm"
        onClick={onSetDefault}
      >
        {route.isDefault ? "既定" : "既定にする"}
      </Button>
      <Input
        value={route.name}
        onChange={(e) => onChange({ ...route, name: e.currentTarget.value })}
        className="flex-1 min-w-40"
        placeholder="路線名(例: 家〜八戸ノ里)"
      />
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        往復
        <MoneyInput
          value={fare}
          onChange={(v) => onChange({ ...route, roundTripFare: v })}
          className="w-24 text-right"
        />
      </label>
      <span className="w-24 text-right font-mono text-sm tabular-nums">
        {route.isDefault
          ? `× ${workDays}日 = ${formatJPY(total)}`
          : `(非選択)`}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="削除"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

/* ----------------------------- ExpensesPanel --------------------------- */

function ExpensesPanel({ monthKey }: { monthKey: string }) {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<CroslanExpense, "id">>({
    date: todayIso(),
    name: "",
    amount: 0,
    note: "",
  });
  const monthExpenses = state.croslanExpenses.filter((e) =>
    e.date.startsWith(monthKey),
  );
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const canAdd = draft.name.trim() && draft.amount > 0;

  return (
    <section className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold">会社へ請求する経費</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            交通費以外の立替(新幹線・消耗品など)。請求書の「経費」欄に合算されます。
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-mono tabular-nums">
          {formatMonthLabel(monthKey)} 合計 {formatJPY(total)}
        </span>
      </div>

      <form
        className="mt-3 grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 md:grid-cols-[140px_1fr_140px_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          set((s) => ({
            ...s,
            croslanExpenses: [
              ...s.croslanExpenses,
              { id: newId(), ...draft },
            ],
          }));
          setDraft({ date: todayIso(), name: "", amount: 0, note: "" });
        }}
      >
        <Input
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.currentTarget.value })}
          className="font-mono"
        />
        <Input
          placeholder="名目(例: 東京新幹線)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
        />
        <MoneyInput
          value={draft.amount}
          onChange={(v) => setDraft({ ...draft, amount: v })}
          placeholder="金額"
        />
        <Input
          placeholder="備考(任意)"
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.currentTarget.value })}
        />
        <Button type="submit" size="sm" disabled={!canAdd}>
          <Plus className="size-3.5" />
          追加
        </Button>
      </form>

      <ul className="mt-3 space-y-1.5">
        {monthExpenses.map((ex) => (
          <li
            key={ex.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
          >
            <span className="w-16 font-mono text-xs text-muted-foreground">
              {ex.date.slice(5)}
            </span>
            <span className="flex-1 truncate">{ex.name}</span>
            {ex.note ? (
              <span className="truncate text-xs text-muted-foreground">
                {ex.note}
              </span>
            ) : null}
            <span className="w-28 text-right font-mono tabular-nums">
              {formatJPY(ex.amount)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                set((s) => ({
                  ...s,
                  croslanExpenses: s.croslanExpenses.filter(
                    (x) => x.id !== ex.id,
                  ),
                }))
              }
              aria-label="削除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
        {monthExpenses.length === 0 ? (
          <li className="rounded-lg bg-muted/30 py-6 text-center text-xs text-muted-foreground">
            今月の経費登録はありません
          </li>
        ) : null}
      </ul>
    </section>
  );
}
