import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  FileText,
  HandCoins,
  Printer,
  ReceiptText,
  Sparkles,
} from "lucide-react";

import { CuentaForms } from "@/components/forms/cuenta-forms";
import { LogoutButton } from "@/components/forms/logout-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getCuentaDashboardData } from "@/lib/cuenta-db";
import { formatCurrency, formatHours, getInvoiceTotal, getMinutesBetween } from "@/lib/cuenta-data";
import { requirePersonalSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function Home() {
  await connection();
  await requirePersonalSession();

  const {
    transactions,
    loans,
    timeEntries,
    invoice,
    monthKey,
    totals,
    businessByCategory,
    businessByMonth,
    source,
    setupMessage,
  } = await getCuentaDashboardData();

  const monthLabel = monthKey.replace("-", "年") + "月";
  const monthTransactions = transactions.filter((transaction) =>
    transaction.date.startsWith(monthKey),
  );
  const invoiceTotal = getInvoiceTotal(invoice);
  const dashboardCards = [
    {
      title: "今月の個人支出",
      value: formatCurrency(totals.personalExpense),
      detail: "生活費と個人利用分を集約",
      icon: CircleDollarSign,
    },
    {
      title: "今月の事業経費",
      value: formatCurrency(totals.businessExpense),
      detail: "確定申告の元データになる支出",
      icon: BriefcaseBusiness,
    },
    {
      title: "未回収の立替金",
      value: formatCurrency(totals.openLoanBalance),
      detail: "友人への貸し分のみを表示",
      icon: HandCoins,
    },
    {
      title: "記録した稼働時間",
      value: formatHours(totals.trackedMinutes),
      detail: "登録済み勤怠の合計",
      icon: CalendarClock,
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="mesh-panel hero-glow p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/80 text-slate-700" variant="secondary">
                {source === "supabase" ? "Live Supabase Data" : "Sample Mode"}
              </Badge>
              <span className="section-kicker">Cuenta / 個人用 総合管理</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                お金、時間、請求、確定申告の準備を
                <br />
                ひとつの画面で整理する。
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Cuenta は、個人の家計と個人事業の運営情報を同じ場所で見渡すためのダッシュボードです。
                登録フォームから保存した内容は、Supabase 設定後にここへそのまま反映されます。
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[26rem]">
            <div className="rounded-3xl border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="section-kicker">Monthly Income</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {formatCurrency(totals.monthlyIncome)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {monthLabel}の入金合計。支出や請求との比較に使えます。
              </p>
            </div>
            <div className="rounded-3xl border border-white/60 bg-slate-900 p-4 text-slate-50 shadow-sm">
              <p className="section-kicker text-slate-300">
                {source === "supabase" ? "Connection Status" : "Setup Status"}
              </p>
              <p className="mt-3 text-xl font-semibold leading-8">
                {setupMessage}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="mesh-panel border-white/60 bg-white/75">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between">
                  <span className="section-kicker">{card.title}</span>
                  <div className="rounded-2xl bg-slate-900 p-2 text-white">
                    <Icon className="size-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                  {card.value}
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600">
                  {card.detail}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="mesh-panel border-white/60 bg-white/70">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <span className="section-kicker">Overview</span>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                今日の運用状況
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-6 text-slate-600">
                主要5機能をこの1画面で確認できます。フォーム送信後はこの一覧が更新されます。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <LogoutButton />
              <Link
                href="/invoice/preview"
                className={cn(
                  buttonVariants({
                    className: "bg-slate-900 text-white hover:bg-slate-800",
                  }),
                )}
              >
                請求書を開く
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                href="/invoice/preview"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                印刷用ページ
                <Printer className="size-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transactions" className="gap-5">
              <TabsList variant="line" className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="transactions">トランザクション</TabsTrigger>
                <TabsTrigger value="loans">貸借管理</TabsTrigger>
                <TabsTrigger value="time">勤怠</TabsTrigger>
                <TabsTrigger value="tax">申告準備</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {monthLabel}の入出金
                    </p>
                    <p className="text-sm text-slate-600">
                      個人用と事業用をラベルで区別し、事業経費はそのまま申告集計へ回せる設計です。
                    </p>
                  </div>
                  <Badge variant="outline">{monthTransactions.length} records</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead>区分</TableHead>
                      <TableHead>科目</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {transaction.date}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {transaction.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {transaction.counterparty}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={
                                transaction.scope === "business"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {transaction.scope === "business" ? "事業用" : "個人用"}
                            </Badge>
                            <Badge variant="outline">
                              {transaction.kind === "income" ? "入金" : "支出"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            transaction.kind === "income"
                              ? "text-emerald-600"
                              : "text-slate-900"
                          }`}
                        >
                          {transaction.kind === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="loans" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      友人との貸借管理
                    </p>
                    <p className="text-sm text-slate-600">
                      未回収の立替金を先頭で確認できるようにしています。
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900" variant="secondary">
                    {loans.filter((loan) => loan.status === "open").length} open
                  </Badge>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {loans.map((loan) => (
                    <Card
                      key={loan.id}
                      className={`border ${
                        loan.status === "open"
                          ? "border-amber-300 bg-amber-50/80"
                          : "border-slate-200 bg-slate-50/80"
                      }`}
                    >
                      <CardHeader className="gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-lg text-slate-900">
                            {loan.person}
                          </CardTitle>
                          <Badge
                            variant={loan.status === "open" ? "default" : "outline"}
                          >
                            {loan.status === "open" ? "未回収" : "精算済"}
                          </Badge>
                        </div>
                        <CardDescription>{loan.memo}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-slate-500">金額</p>
                            <p className="text-2xl font-semibold text-slate-900">
                              {formatCurrency(loan.amount)}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {loan.direction === "lent" ? "貸している" : "借りている"}
                          </Badge>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3 text-sm text-slate-600">
                          期限:{" "}
                          <span className="font-mono text-slate-900">
                            {loan.dueDate}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      勤怠・時間管理
                    </p>
                    <p className="text-sm text-slate-600">
                      開始時刻と終了時刻から稼働時間を自動計算して保存します。
                    </p>
                  </div>
                  <Badge variant="outline">{formatHours(totals.trackedMinutes)}</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>クライアント</TableHead>
                      <TableHead>作業内容</TableHead>
                      <TableHead>時間帯</TableHead>
                      <TableHead className="text-right">稼働時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {entry.date}
                        </TableCell>
                        <TableCell>{entry.client}</TableCell>
                        <TableCell className="max-w-[24rem] whitespace-normal">
                          {entry.work}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {entry.start} - {entry.end}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatHours(getMinutesBetween(entry.start, entry.end))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="tax" className="space-y-6">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    確定申告準備のための集計
                  </p>
                  <p className="text-sm text-slate-600">
                    事業用に分類された支出だけを、自動で月別と勘定科目別にまとめています。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-emerald-200 bg-emerald-50/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-emerald-950">
                        月別の事業経費
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {businessByMonth.map((item) => (
                        <div
                          key={item.month}
                          className="flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3"
                        >
                          <span className="font-mono text-sm text-slate-500">
                            {item.month}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-sky-200 bg-sky-50/80">
                    <CardHeader>
                      <CardTitle className="text-lg text-sky-950">
                        勘定科目別の事業経費
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {businessByCategory.map((item) => (
                        <div
                          key={item.category}
                          className="flex items-center justify-between rounded-2xl bg-white/85 px-4 py-3"
                        >
                          <span className="text-sm text-slate-600">
                            {item.category}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="mesh-panel border-white/60 bg-white/75">
            <CardHeader className="space-y-3">
              <span className="section-kicker">Invoice Preview</span>
              <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
                <FileText className="size-5" />
                請求書発行
              </CardTitle>
              <CardDescription className="leading-6">
                保存した最新の請求書を印刷しやすいレイアウトで確認できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-4">
                  <div>
                    <p className="section-kicker">Invoice No.</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                  <Badge variant="outline">{invoice.issuedOn}</Badge>
                </div>
                <div className="space-y-3 pt-4 text-sm text-slate-600">
                  <p>件名: {invoice.subject}</p>
                  <p>請求先: {invoice.clientName}</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatCurrency(invoiceTotal)}
                  </p>
                </div>
              </div>
              <Link
                href="/invoice/preview"
                className={cn(
                  buttonVariants({
                    className: "w-full bg-slate-900 text-white hover:bg-slate-800",
                  }),
                )}
              >
                印刷プレビューを開く
                <Printer className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="mesh-panel border-white/60 bg-slate-900 text-slate-50">
            <CardHeader className="space-y-3">
              <span className="section-kicker text-slate-300">Roadmap</span>
              <CardTitle className="flex items-center gap-2 text-2xl text-white">
                <Sparkles className="size-5" />
                次の実装候補
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                1. ログイン機能と RLS の有効化
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                2. 各データの編集・削除フロー
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                3. ダッシュボードの月切替と検索
              </div>
              <div className="rounded-2xl bg-white/8 px-4 py-3">
                4. 請求書の複数明細と税計算
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="mesh-panel border-white/60 bg-white/80">
          <CardHeader className="space-y-3">
            <span className="section-kicker">Quick Entry</span>
            <CardTitle className="text-2xl text-slate-900">
              登録フォーム
            </CardTitle>
            <CardDescription className="max-w-2xl leading-6">
              トランザクション、貸借、勤怠、請求書の登録フォームを実装しました。Server
              Action から Supabase に保存し、保存後はトップページと請求書プレビューを再検証します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CuentaForms />
          </CardContent>
        </Card>

        <Card className="mesh-panel border-white/60 bg-white/75">
          <CardHeader className="space-y-3">
            <span className="section-kicker">Feature Coverage</span>
            <CardTitle className="text-2xl text-slate-900">
              実装済みの開発基盤
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                icon: ReceiptText,
                label: "トランザクション管理",
                state: "一覧 + 登録フォーム + 月次集計",
              },
              {
                icon: HandCoins,
                label: "貸借管理",
                state: "一覧 + 未回収可視化 + 登録フォーム",
              },
              {
                icon: FileText,
                label: "請求書発行",
                state: "登録フォーム + プレビュー + 印刷対応",
              },
              {
                icon: CalendarClock,
                label: "勤怠・時間管理",
                state: "自動時間計算 + 一覧 + 登録フォーム",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-900 p-2 text-white">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.state}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
