"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppState, useAppStateSetter } from "@/lib/store";
import {
  currentMonthKey,
  formatJPY,
  formatMonthLabel,
  minutesBetween,
  todayIso,
} from "@/lib/format";
import type { TimeEntry } from "@/lib/types";

function workedMinutes(entry: TimeEntry) {
  return Math.max(0, minutesBetween(entry.start, entry.end) - (entry.breakMinutes || 0));
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function jpDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${y}年${Number(m).toString().padStart(2, "0")}月${Number(d)
    .toString()
    .padStart(2, "0")}日`;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">読込中…</div>}>
      <InvoicePage />
    </Suspense>
  );
}

function InvoicePage() {
  const params = useSearchParams();
  const monthKey = params.get("month") ?? currentMonthKey();
  const state = useAppState();
  const set = useAppStateSetter();

  // 対象月の稼働から業務委託報酬と交通費を計算
  const monthEntries = state.timeEntries.filter((e) =>
    e.date.startsWith(monthKey),
  );
  const workMinutes = monthEntries.reduce((s, e) => s + workedMinutes(e), 0);
  const workDays = monthEntries.filter((e) => workedMinutes(e) > 0).length;
  const defaultRoute =
    state.commuteRoutes.find((r) => r.isDefault) ?? state.commuteRoutes[0];

  const autoWorkReward = Math.round((workMinutes / 60) * state.hourlyRate);
  const autoTransport = defaultRoute
    ? workDays * defaultRoute.roundTripFare
    : 0;
  const autoExpenses = state.croslanExpenses
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((s, e) => s + e.amount, 0);

  // 編集可能なフィールド(初期値は上の自動計算)
  const [workReward, setWorkReward] = useState(autoWorkReward);
  const [transportFee, setTransportFee] = useState(autoTransport);
  const [expensesTotal, setExpensesTotal] = useState(autoExpenses);

  const total = workReward + transportFee + expensesTotal;

  // その他ヘッダ項目
  const [issuedOn, setIssuedOn] = useState(todayIso());
  const [paymentDueOn, setPaymentDueOn] = useState(addDays(todayIso(), 30));
  const [workMonth, setWorkMonth] = useState(monthKey);
  const [invoiceNumber, setInvoiceNumber] = useState(
    String(state.invoiceSettings.nextInvoiceNumber).padStart(3, "0"),
  );

  const s = state.invoiceSettings;

  const reloadFromMonth = useMemo(
    () => () => {
      setWorkReward(autoWorkReward);
      setTransportFee(autoTransport);
      setExpensesTotal(autoExpenses);
    },
    [autoWorkReward, autoTransport, autoExpenses],
  );

  const incrementInvoiceNumber = () => {
    set((prev) => ({
      ...prev,
      invoiceSettings: {
        ...prev.invoiceSettings,
        nextInvoiceNumber: prev.invoiceSettings.nextInvoiceNumber + 1,
      },
    }));
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* ツールバー(印刷時は非表示) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/croslan">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-3.5" />
            CROSLANに戻る
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reloadFromMonth}>
            <RefreshCw className="size-3.5" />
            今月の値で再計算
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={incrementInvoiceNumber}
          >
            番号を次へ進める
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" />
            印刷 / PDF 保存
          </Button>
        </div>
      </div>

      {/* 編集パネル(印刷時は非表示) */}
      <div className="mb-6 grid gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 print:hidden md:grid-cols-2">
        <label className="space-y-1">
          <span className="section-kicker">請求日</span>
          <Input
            type="date"
            value={issuedOn}
            onChange={(e) => setIssuedOn(e.currentTarget.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">支払期日</span>
          <Input
            type="date"
            value={paymentDueOn}
            onChange={(e) => setPaymentDueOn(e.currentTarget.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">業務月</span>
          <Input
            type="month"
            value={workMonth}
            onChange={(e) => setWorkMonth(e.currentTarget.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">請求書番号</span>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">業務委託報酬</span>
          <Input
            type="number"
            value={workReward}
            onChange={(e) => setWorkReward(Number(e.currentTarget.value) || 0)}
          />
        </label>
        <label className="space-y-1">
          <span className="section-kicker">交通費</span>
          <Input
            type="number"
            value={transportFee}
            onChange={(e) =>
              setTransportFee(Number(e.currentTarget.value) || 0)
            }
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="section-kicker">経費</span>
          <Input
            type="number"
            value={expensesTotal}
            onChange={(e) =>
              setExpensesTotal(Number(e.currentTarget.value) || 0)
            }
          />
        </label>
      </div>

      {/* 本体(印刷対象) */}
      <article className="mx-auto max-w-[700px] rounded-xl border border-border/60 bg-white px-10 py-12 text-black shadow-sm print:max-w-none print:border-0 print:rounded-none print:shadow-none print:p-0">
        <h1 className="text-center text-3xl font-semibold tracking-[0.4em]">
          請求書
        </h1>

        <div className="mt-10 flex items-start justify-between text-sm">
          <p className="text-lg font-semibold">{s.clientName}  御中</p>
          <div className="text-right text-sm leading-7">
            <p>請求日:{jpDate(issuedOn)}</p>
            <p>請求書番号:{invoiceNumber}</p>
          </div>
        </div>

        <p className="mt-8 text-sm leading-7">
          下記の通り、{formatMonthLabel(workMonth)}
          に従事した業務に関する委託料をご請求申し上げます。
        </p>

        <div className="my-10 flex justify-center">
          <div className="border border-black px-8 py-5 text-center">
            <p className="text-base font-semibold">
              【ご請求金額】(税込) {formatJPY(total)}
            </p>
          </div>
        </div>

        <section className="space-y-2 text-sm leading-7">
          <p className="font-semibold">【請求内容】</p>
          <p>・業務委託報酬 :{formatJPY(workReward)}</p>
          <p>・交通費:{formatJPY(transportFee)}</p>
          <p>・経費:{formatJPY(expensesTotal)}</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7">
          <p className="font-semibold">【支払期日】</p>
          <p>{jpDate(paymentDueOn)}</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7">
          <p className="font-semibold">【振込先口座】</p>
          <p>
            銀行名:{s.bankName} {s.branchName}(支店コード:{s.branchCode})
          </p>
          <p>口座番号:{s.accountNumber}</p>
          <p>口座名義:{s.accountHolder}</p>
        </section>

        <section className="mt-6 space-y-1 text-sm leading-7">
          <p className="font-semibold">【備考】</p>
          {s.notes.map((n) => (
            <p key={n}>・{n}</p>
          ))}
        </section>

        <p className="mt-6 text-sm leading-7">以上、よろしくお願いいたします。</p>

        <hr className="my-8 border-t border-black" />

        <section className="space-y-1 text-sm leading-7">
          <p>発行者:{s.issuerName}</p>
          <p>住所:{s.issuerAddress}</p>
          <p>電話:{s.issuerPhone}</p>
          <p>メール:{s.issuerEmail}</p>
        </section>
        <hr className="mt-8 border-t border-black" />
      </article>
    </div>
  );
}
