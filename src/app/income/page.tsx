"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, newId } from "@/lib/store";
import {
  currentMonthKey,
  formatJPY,
  minutesBetween,
  shortDate,
  todayIso,
} from "@/lib/format";
import type { LoanOut, ScheduledPayment } from "@/lib/types";

export default function IncomePage() {
  const state = useAppState();

  const monthKey = currentMonthKey();

  const {
    bankTotal,
    cardsTotal,
    cardsCurrent,
    cardsNext,
    upcomingTotal,
    loansTotal,
    monthMinutes,
    monthSalary,
    forecast,
  } = useMemo(() => {
    const bankTotal = state.banks.reduce((s, b) => s + b.balance, 0);
    const cardsCurrent = state.cards.reduce(
      (s, c) => s + (c.currentBilledAmount || 0),
      0,
    );
    const cardsNext = state.cards.reduce(
      (s, c) => s + (c.nextBilledAmount || 0),
      0,
    );
    const cardsTotal = cardsCurrent + cardsNext;
    const upcomingTotal = state.upcoming.reduce((s, p) => s + p.amount, 0);
    const loansTotal = state.loans
      .filter((l) => !l.settled)
      .reduce((s, l) => s + l.amount, 0);
    const monthMinutes = state.timeEntries
      .filter((e) => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + minutesBetween(e.start, e.end), 0);
    const monthSalary = Math.round((monthMinutes / 60) * state.hourlyRate);
    const forecast = bankTotal + monthSalary - cardsTotal - upcomingTotal;
    return {
      bankTotal,
      cardsTotal,
      cardsCurrent,
      cardsNext,
      upcomingTotal,
      loansTotal,
      monthMinutes,
      monthSalary,
      forecast,
    };
  }, [state, monthKey]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="Income & Expenses"
        title="収支"
        description="銀行残高・クレカの支払い・引き落とし予定・貸付・給与予定をまとめて管理。入力するとすぐに下の数字が変わります。"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="手持ち(銀行合計)"
          value={formatJPY(bankTotal)}
          hint="登録した銀行口座の残高の合計"
        />
        <StatCard
          label="今月の給与予定"
          value={formatJPY(monthSalary)}
          hint={`勤怠 ${(monthMinutes / 60).toFixed(1)}h × 時給 ${formatJPY(
            state.hourlyRate,
          )} / 翌月${state.salaryPayDay}日入金`}
          tone="positive"
        />
        <StatCard
          label="クレカ支払い合計"
          value={formatJPY(cardsTotal)}
          hint={`直近 ${formatJPY(cardsCurrent)} + 次回 ${formatJPY(cardsNext)}`}
          tone="warning"
        />
        <StatCard
          label="見込み残高"
          value={formatJPY(forecast)}
          hint="手持ち + 給与予定 − クレカ − 引落予定"
          tone={forecast < 0 ? "negative" : "default"}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <BankPanel />
        <CardsPanel />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <UpcomingPanel total={upcomingTotal} />
        <LoansPanel total={loansTotal} />
      </section>
    </div>
  );
}

/* ------------------------------ Bank accounts ------------------------------ */

function Panel({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function BankPanel() {
  const state = useAppState();
  const set = useAppStateSetter();

  return (
    <Panel
      title="銀行残高"
      description="三菱UFJ銀行・住信SBI銀行などの現在残高を入力"
      right={
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            set((s) => ({
              ...s,
              banks: [
                ...s.banks,
                { id: newId(), name: "新しい口座", balance: 0 },
              ],
            }))
          }
        >
          <Plus className="size-3.5" />
          追加
        </Button>
      }
    >
      <ul className="space-y-3">
        {state.banks.map((bank) => (
          <li
            key={bank.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
          >
            <Input
              value={bank.name}
              onChange={(e) =>
                set((s) => ({
                  ...s,
                  banks: s.banks.map((b) =>
                    b.id === bank.id ? { ...b, name: e.currentTarget.value } : b,
                  ),
                }))
              }
              className="flex-1"
              placeholder="口座名"
            />
            <MoneyInput
              value={bank.balance}
              onChange={(v) =>
                set((s) => ({
                  ...s,
                  banks: s.banks.map((b) =>
                    b.id === bank.id ? { ...b, balance: v } : b,
                  ),
                }))
              }
              className="w-40 text-right"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                set((s) => ({
                  ...s,
                  banks: s.banks.filter((b) => b.id !== bank.id),
                }))
              }
              aria-label="削除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
        {state.banks.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            口座を追加してください
          </p>
        ) : null}
      </ul>
    </Panel>
  );
}

/* --------------------------------- Cards ---------------------------------- */

function CardsPanel() {
  const state = useAppState();
  const set = useAppStateSetter();

  return (
    <Panel
      title="クレジットカード"
      description="直近の引き落とし額と、その次の引き落とし額を入力(支払日ごとに落ちる予定)"
      right={
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            set((s) => ({
              ...s,
              cards: [
                ...s.cards,
                {
                  id: newId(),
                  name: "新しいカード",
                  payDay: 27,
                  currentBilledAmount: 0,
                  nextBilledAmount: 0,
                },
              ],
            }))
          }
        >
          <Plus className="size-3.5" />
          追加
        </Button>
      }
    >
      <ul className="space-y-3">
        {state.cards.map((card) => (
          <li
            key={card.id}
            className="space-y-2 rounded-lg border border-border/60 bg-background/60 p-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={card.name}
                onChange={(e) =>
                  set((s) => ({
                    ...s,
                    cards: s.cards.map((c) =>
                      c.id === card.id
                        ? { ...c, name: e.currentTarget.value }
                        : c,
                    ),
                  }))
                }
                placeholder="カード名"
                className="flex-1"
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                毎月
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={card.payDay}
                  onChange={(e) =>
                    set((s) => ({
                      ...s,
                      cards: s.cards.map((c) =>
                        c.id === card.id
                          ? {
                              ...c,
                              payDay: Math.max(
                                1,
                                Math.min(31, Number(e.currentTarget.value) || 1),
                              ),
                            }
                          : c,
                      ),
                    }))
                  }
                  className="w-14 text-center font-mono"
                />
                日払い
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  set((s) => ({
                    ...s,
                    cards: s.cards.filter((c) => c.id !== card.id),
                  }))
                }
                aria-label="削除"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="section-kicker">直近の引落</span>
                <MoneyInput
                  value={card.currentBilledAmount}
                  onChange={(v) =>
                    set((s) => ({
                      ...s,
                      cards: s.cards.map((c) =>
                        c.id === card.id ? { ...c, currentBilledAmount: v } : c,
                      ),
                    }))
                  }
                />
              </label>
              <label className="space-y-1">
                <span className="section-kicker">次回の引落</span>
                <MoneyInput
                  value={card.nextBilledAmount}
                  onChange={(v) =>
                    set((s) => ({
                      ...s,
                      cards: s.cards.map((c) =>
                        c.id === card.id ? { ...c, nextBilledAmount: v } : c,
                      ),
                    }))
                  }
                />
              </label>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              合計:
              <span className="ml-1 font-mono font-semibold text-foreground">
                {formatJPY(
                  (card.currentBilledAmount || 0) + (card.nextBilledAmount || 0),
                )}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ----------------------- Upcoming scheduled payments ---------------------- */

function UpcomingPanel({ total }: { total: number }) {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<ScheduledPayment, "id">>({
    name: "",
    amount: 0,
    dueDate: todayIso(),
  });

  const canAdd = draft.name.trim().length > 0 && draft.amount > 0;

  return (
    <Panel
      title="今後の引き落とし"
      description="家賃・サブスク・公共料金など、先の予定もすべて登録"
      right={
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-mono tabular-nums">
          合計 {formatJPY(total)}
        </span>
      }
    >
      <ul className="space-y-2">
        {[...state.upcoming]
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
            >
              <span className="w-12 font-mono text-xs text-muted-foreground">
                {shortDate(item.dueDate)}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              <span className="font-mono tabular-nums text-rose-600">
                -{formatJPY(item.amount)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  set((s) => ({
                    ...s,
                    upcoming: s.upcoming.filter((u) => u.id !== item.id),
                  }))
                }
                aria-label="削除"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        {state.upcoming.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            まだ登録がありません
          </p>
        ) : null}
      </ul>

      <form
        className="grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 sm:grid-cols-[100px_1fr_140px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          set((s) => ({
            ...s,
            upcoming: [...s.upcoming, { id: newId(), ...draft }],
          }));
          setDraft({ name: "", amount: 0, dueDate: todayIso() });
        }}
      >
        <Input
          type="date"
          value={draft.dueDate}
          onChange={(e) => setDraft({ ...draft, dueDate: e.currentTarget.value })}
          className="font-mono"
        />
        <Input
          placeholder="名目 (家賃・サブスク etc.)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
        />
        <MoneyInput
          value={draft.amount}
          onChange={(v) => setDraft({ ...draft, amount: v })}
          placeholder="金額"
        />
        <Button type="submit" size="sm" disabled={!canAdd}>
          追加
        </Button>
      </form>
    </Panel>
  );
}

/* --------------------------------- Loans --------------------------------- */

function LoansPanel({ total }: { total: number }) {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<LoanOut, "id" | "settled">>({
    person: "",
    amount: 0,
    dueDate: undefined,
    note: "",
  });

  const canAdd = draft.person.trim().length > 0 && draft.amount > 0;

  return (
    <Panel
      title="貸してるお金"
      description="回収していない立替を記録。回収したらチェックで消化"
      right={
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-mono tabular-nums text-amber-900">
          未回収 {formatJPY(total)}
        </span>
      }
    >
      <ul className="space-y-2">
        {state.loans.map((loan) => (
          <li
            key={loan.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm"
          >
            <Input
              value={loan.person}
              onChange={(e) =>
                set((s) => ({
                  ...s,
                  loans: s.loans.map((l) =>
                    l.id === loan.id
                      ? { ...l, person: e.currentTarget.value }
                      : l,
                  ),
                }))
              }
              className="w-28"
              placeholder="相手"
            />
            <Input
              value={loan.note ?? ""}
              onChange={(e) =>
                set((s) => ({
                  ...s,
                  loans: s.loans.map((l) =>
                    l.id === loan.id ? { ...l, note: e.currentTarget.value } : l,
                  ),
                }))
              }
              className="flex-1"
              placeholder="メモ"
            />
            <MoneyInput
              value={loan.amount}
              onChange={(v) =>
                set((s) => ({
                  ...s,
                  loans: s.loans.map((l) =>
                    l.id === loan.id ? { ...l, amount: v } : l,
                  ),
                }))
              }
              className="w-32 text-right"
            />
            <Button
              variant={loan.settled ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                set((s) => ({
                  ...s,
                  loans: s.loans.map((l) =>
                    l.id === loan.id ? { ...l, settled: !l.settled } : l,
                  ),
                }))
              }
            >
              {loan.settled ? "済" : "未"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                set((s) => ({
                  ...s,
                  loans: s.loans.filter((l) => l.id !== loan.id),
                }))
              }
              aria-label="削除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
        {state.loans.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">
            まだ登録がありません
          </p>
        ) : null}
      </ul>

      <form
        className="grid gap-2 rounded-lg border border-dashed border-border/70 bg-muted/30 p-3 sm:grid-cols-[120px_1fr_140px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canAdd) return;
          set((s) => ({
            ...s,
            loans: [...s.loans, { id: newId(), settled: false, ...draft }],
          }));
          setDraft({ person: "", amount: 0, dueDate: undefined, note: "" });
        }}
      >
        <Input
          placeholder="相手の名前"
          value={draft.person}
          onChange={(e) => setDraft({ ...draft, person: e.currentTarget.value })}
        />
        <Input
          placeholder="メモ(任意)"
          value={draft.note ?? ""}
          onChange={(e) => setDraft({ ...draft, note: e.currentTarget.value })}
        />
        <MoneyInput
          value={draft.amount}
          onChange={(v) => setDraft({ ...draft, amount: v })}
          placeholder="金額"
        />
        <Button type="submit" size="sm" disabled={!canAdd}>
          追加
        </Button>
      </form>
    </Panel>
  );
}
