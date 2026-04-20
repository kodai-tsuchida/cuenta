"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { MoneyInput } from "@/components/money-input";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  deleteReceipt,
  listReceipts,
  saveReceipt,
  type ReceiptRecord,
} from "@/lib/idb";
import { downloadBackup, restoreFromFile } from "@/lib/backup";
import { newId, useAppState, useAppStateSetter } from "@/lib/store";
import {
  formatJPY,
  minutesBetween,
  todayIso,
} from "@/lib/format";
import type { JournalEntry, TimeEntry } from "@/lib/types";

const EXPENSE_ACCOUNT_CODES = new Set([
  "601", // 旅費交通費
  "602", // 通信費
  "603", // 消耗品費
  "604", // 広告宣伝費
  "605", // 接待交際費
  "606", // 新聞図書費
  "607", // 外注費
  "608", // 地代家賃
  "609", // 水道光熱費
  "699", // 雑費
]);

const SUGGESTED_ACCOUNTS = [
  { code: "100", name: "現金" },
  { code: "101", name: "普通預金" },
  { code: "203", name: "事業主借" },
  { code: "204", name: "事業主貸" },
  { code: "400", name: "売上高" },
  { code: "601", name: "旅費交通費" },
  { code: "602", name: "通信費" },
  { code: "603", name: "消耗品費" },
  { code: "604", name: "広告宣伝費" },
  { code: "605", name: "接待交際費" },
  { code: "606", name: "新聞図書費" },
  { code: "607", name: "外注費" },
  { code: "608", name: "地代家賃" },
  { code: "609", name: "水道光熱費" },
  { code: "699", name: "雑費" },
];

function workedMinutes(entry: TimeEntry) {
  return Math.max(
    0,
    minutesBetween(entry.start, entry.end) - (entry.breakMinutes || 0),
  );
}

function currentYear() {
  return new Date().getFullYear();
}

export default function ZouPage() {
  const state = useAppState();

  // 仕訳帳から年内の売上と経費を集計(現在年)
  const year = currentYear();
  const yearJournal = state.journal.filter((j) =>
    j.date.startsWith(String(year)),
  );

  const businessIncome = yearJournal
    .filter((j) => j.creditAccount === "売上高" || j.creditCode === "400")
    .reduce((s, j) => s + j.creditAmount, 0);

  const businessExpense = yearJournal
    .filter((j) => EXPENSE_ACCOUNT_CODES.has(j.debitCode))
    .reduce((s, j) => s + j.debitAmount, 0);

  // CROSLAN の今年の給与(交通費含めず)
  const yearTimeEntries = state.timeEntries.filter((e) =>
    e.date.startsWith(String(year)),
  );
  const yearWorkMinutes = yearTimeEntries.reduce(
    (s, e) => s + workedMinutes(e),
    0,
  );
  const wages = Math.round((yearWorkMinutes / 60) * state.hourlyRate);

  // CROSLAN の交通費(年合計)
  const yearWorkDays = yearTimeEntries.filter(
    (e) => workedMinutes(e) > 0,
  ).length;
  const defaultRoute =
    state.commuteRoutes.find((r) => r.isDefault) ?? state.commuteRoutes[0];
  const yearTransport = defaultRoute
    ? yearWorkDays * defaultRoute.roundTripFare
    : 0;
  // 会社経費(交通費以外)
  const yearCroslanExpenses = state.croslanExpenses
    .filter((e) => e.date.startsWith(String(year)))
    .reduce((s, e) => s + e.amount, 0);
  // 給与総額 = 給与 + 交通費 + 経費(社保扶養判定向け)
  const wagesGrossForSocial = wages + yearTransport + yearCroslanExpenses;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        kicker="Zou Dev"
        title="ゾウさん開発(個人事業)"
        description="青色申告のための仕訳帳・レシート保管・扶養内シミュレーターをまとめて。レシートはこの端末の IndexedDB に保存されます。バックアップは必ず取ってください。"
      />

      <Tabs defaultValue="dashboard">
        <TabsList variant="line">
          <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
          <TabsTrigger value="journal">仕訳帳</TabsTrigger>
          <TabsTrigger value="receipts">レシート</TabsTrigger>
          <TabsTrigger value="backup">バックアップ</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab
            businessIncome={businessIncome}
            businessExpense={businessExpense}
            wages={wages}
            wagesGrossForSocial={wagesGrossForSocial}
          />
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <JournalTab />
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <ReceiptsTab />
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <BackupTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- Dashboard ------------------------------ */

function DashboardTab({
  businessIncome,
  businessExpense,
  wages,
  wagesGrossForSocial,
}: {
  businessIncome: number;
  businessExpense: number;
  wages: number;
  wagesGrossForSocial: number;
}) {
  const profit = businessIncome - businessExpense; // 事業利益
  const businessIncomeAfterAo = Math.max(0, profit - 650_000); // 事業所得(青色65万)
  const salaryIncome = Math.max(0, wages - 550_000); // 給与所得(給与所得控除55万)
  const totalIncomeForTax = salaryIncome + businessIncomeAfterAo; // 合計所得
  const taxLimit = 480_000;
  const taxRoom = taxLimit - totalIncomeForTax;

  // 社保の扶養
  const totalIncomeForSocial = wagesGrossForSocial + profit;
  const socialLimit = 1_300_000;
  const socialRoom = socialLimit - totalIncomeForSocial;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`${currentYear()}年 事業売上`}
          value={formatJPY(businessIncome)}
          tone="positive"
        />
        <StatCard
          label="事業経費"
          value={formatJPY(businessExpense)}
          tone="warning"
        />
        <StatCard
          label="事業利益"
          value={formatJPY(profit)}
          tone={profit < 0 ? "negative" : "default"}
        />
        <StatCard
          label="給与収入(交通費除く)"
          value={formatJPY(wages)}
          hint="CROSLAN の労働時間 × 時給(年合計)"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <FuyouTaxCard
          wages={wages}
          businessIncome={businessIncome}
          businessExpense={businessExpense}
          salaryIncome={salaryIncome}
          businessIncomeAfterAo={businessIncomeAfterAo}
          totalIncomeForTax={totalIncomeForTax}
          taxLimit={taxLimit}
          taxRoom={taxRoom}
        />
        <FuyouSocialCard
          wagesGrossForSocial={wagesGrossForSocial}
          businessProfit={profit}
          totalIncomeForSocial={totalIncomeForSocial}
          socialLimit={socialLimit}
          socialRoom={socialRoom}
        />
      </section>
    </div>
  );
}

function Row({
  no,
  label,
  amount,
  hint,
  bold = false,
}: {
  no?: string;
  label: string;
  amount: number;
  hint?: string;
  bold?: boolean;
}) {
  return (
    <tr className={bold ? "font-semibold" : ""}>
      <td className="py-1.5 pr-2 text-xs text-muted-foreground tabular-nums">
        {no ?? ""}
      </td>
      <td className="py-1.5 pr-2">{label}</td>
      <td className="py-1.5 pr-2 text-right font-mono tabular-nums">
        {formatJPY(amount)}
      </td>
      <td className="py-1.5 text-xs text-muted-foreground">{hint ?? ""}</td>
    </tr>
  );
}

function FuyouTaxCard({
  wages,
  businessIncome,
  businessExpense,
  salaryIncome,
  businessIncomeAfterAo,
  totalIncomeForTax,
  taxLimit,
  taxRoom,
}: {
  wages: number;
  businessIncome: number;
  businessExpense: number;
  salaryIncome: number;
  businessIncomeAfterAo: number;
  totalIncomeForTax: number;
  taxLimit: number;
  taxRoom: number;
}) {
  const profit = businessIncome - businessExpense;
  return (
    <article className="rounded-xl border border-blue-300/60 bg-card/70 p-5 shadow-sm">
      <header className="border-b border-blue-300/40 pb-2">
        <h3 className="font-heading text-base font-semibold text-blue-900">
          A. 税金の扶養(基準:合計所得金額 48万円以下)
        </h3>
      </header>
      <table className="mt-3 w-full text-sm">
        <tbody>
          <Row no="①" label="給与収入" amount={wages} hint="交通費を除く額面合計" />
          <Row
            no="②"
            label="給与所得"
            amount={salaryIncome}
            hint="55万円を引いた額(最低0円)"
          />
          <Row no="③" label="事業売上" amount={businessIncome} hint="売上の合計" />
          <Row no="④" label="経費" amount={businessExpense} hint="経費の合計" />
          <Row no="⑤" label="事業利益" amount={profit} hint="売上 − 経費" />
          <Row
            no="⑥"
            label="事業所得"
            amount={businessIncomeAfterAo}
            hint="利益から青色65万を引く(最低0円)"
          />
          <Row
            label="現在の合計所得"
            amount={totalIncomeForTax}
            hint="② + ⑥"
            bold
          />
          <Row label="上限(税法)" amount={taxLimit} hint="基礎控除額" />
        </tbody>
      </table>
      <div
        className={`mt-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
          taxRoom >= 0
            ? "bg-yellow-100 text-blue-900"
            : "bg-rose-100 text-rose-900"
        }`}
      >
        あと稼げる所得:
        <span className="ml-2 font-mono tabular-nums">
          {taxRoom >= 0 ? "+" : ""}
          {formatJPY(taxRoom)}
        </span>
        <span className="ml-2 text-xs font-normal opacity-80">
          (所得ベース / 売上ベースなら + 経費 + 65万 + 55万 まで OK)
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        ※ 55万円(給与所得控除) + 65万円(青色申告控除) + 48万円(基礎控除) = 168万円までは「税金の扶養」内に収まる目安です。
      </p>
    </article>
  );
}

function FuyouSocialCard({
  wagesGrossForSocial,
  businessProfit,
  totalIncomeForSocial,
  socialLimit,
  socialRoom,
}: {
  wagesGrossForSocial: number;
  businessProfit: number;
  totalIncomeForSocial: number;
  socialLimit: number;
  socialRoom: number;
}) {
  return (
    <article className="rounded-xl border border-rose-300/60 bg-card/70 p-5 shadow-sm">
      <header className="border-b border-rose-300/40 pb-2">
        <h3 className="font-heading text-base font-semibold text-rose-900">
          B. 社会保険の扶養(130万円の壁)
        </h3>
      </header>
      <table className="mt-3 w-full text-sm">
        <tbody>
          <Row
            no="❶"
            label="給与総額"
            amount={wagesGrossForSocial}
            hint="交通費・経費込みの総支給額"
          />
          <Row
            no="❷"
            label="事業利益"
            amount={businessProfit}
            hint="売上 − 経費(青色控除は引けません!)"
          />
          <Row
            label="現在の合計収入"
            amount={totalIncomeForSocial}
            hint="❶ + ❷"
            bold
          />
          <Row label="上限(社保)" amount={socialLimit} />
        </tbody>
      </table>
      <div
        className={`mt-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
          socialRoom >= 0
            ? "bg-yellow-100 text-rose-900"
            : "bg-rose-100 text-rose-900"
        }`}
      >
        あと稼げる金額:
        <span className="ml-2 font-mono tabular-nums">
          {socialRoom >= 0 ? "+" : ""}
          {formatJPY(socialRoom)}
        </span>
        <span className="ml-2 text-xs font-normal opacity-80">
          (売上ベース)
        </span>
      </div>
    </article>
  );
}

/* ------------------------------- Journal ------------------------------- */

function JournalTab() {
  const state = useAppState();
  const set = useAppStateSetter();

  const [draft, setDraft] = useState<Omit<JournalEntry, "id">>({
    date: todayIso(),
    debitCode: "100",
    debitAccount: "現金",
    debitAmount: 0,
    creditCode: "400",
    creditAccount: "売上高",
    creditAmount: 0,
    description: "",
  });

  const totalDebit = state.journal.reduce((s, j) => s + j.debitAmount, 0);
  const totalCredit = state.journal.reduce((s, j) => s + j.creditAmount, 0);

  const canAdd =
    (draft.debitAmount > 0 || draft.creditAmount > 0) && draft.description.trim();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="借方合計" value={formatJPY(totalDebit)} />
        <StatCard label="貸方合計" value={formatJPY(totalCredit)} />
        <StatCard
          label="差額"
          value={formatJPY(totalDebit - totalCredit)}
          tone={totalDebit !== totalCredit ? "warning" : "positive"}
          hint={
            totalDebit !== totalCredit
              ? "借方と貸方が一致していません"
              : "OK(複式簿記の原則)"
          }
        />
      </section>

      <section className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm">
        <h3 className="mb-2 font-heading text-base font-semibold">仕訳を追加</h3>
        <form
          className="grid gap-2 md:grid-cols-[140px_repeat(3,_minmax(0,_1fr))_repeat(3,_minmax(0,_1fr))_2fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAdd) return;
            set((s) => ({
              ...s,
              journal: [...s.journal, { id: newId(), ...draft }],
            }));
            setDraft({
              ...draft,
              date: todayIso(),
              debitAmount: 0,
              creditAmount: 0,
              description: "",
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
            placeholder="借方コード"
            value={draft.debitCode}
            onChange={(e) => {
              const code = e.currentTarget.value;
              const found = SUGGESTED_ACCOUNTS.find((a) => a.code === code);
              setDraft({
                ...draft,
                debitCode: code,
                debitAccount: found?.name ?? draft.debitAccount,
              });
            }}
            list="account-list-debit"
            className="font-mono"
          />
          <Input
            placeholder="借方科目"
            value={draft.debitAccount}
            onChange={(e) =>
              setDraft({ ...draft, debitAccount: e.currentTarget.value })
            }
          />
          <MoneyInput
            value={draft.debitAmount}
            onChange={(v) => setDraft({ ...draft, debitAmount: v })}
            placeholder="借方金額"
          />
          <Input
            placeholder="貸方コード"
            value={draft.creditCode}
            onChange={(e) => {
              const code = e.currentTarget.value;
              const found = SUGGESTED_ACCOUNTS.find((a) => a.code === code);
              setDraft({
                ...draft,
                creditCode: code,
                creditAccount: found?.name ?? draft.creditAccount,
              });
            }}
            list="account-list-credit"
            className="font-mono"
          />
          <Input
            placeholder="貸方科目"
            value={draft.creditAccount}
            onChange={(e) =>
              setDraft({ ...draft, creditAccount: e.currentTarget.value })
            }
          />
          <MoneyInput
            value={draft.creditAmount}
            onChange={(v) => setDraft({ ...draft, creditAmount: v })}
            placeholder="貸方金額"
          />
          <Input
            placeholder="摘要"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.currentTarget.value })
            }
          />
          <Button type="submit" size="sm" disabled={!canAdd}>
            <Plus className="size-3.5" />
            追加
          </Button>
        </form>
        <datalist id="account-list-debit">
          {SUGGESTED_ACCOUNTS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </datalist>
        <datalist id="account-list-credit">
          {SUGGESTED_ACCOUNTS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </datalist>
        <p className="mt-2 text-[11px] text-muted-foreground">
          コード列に「100」や「400」などを入れると科目名が自動で埋まります。例:売上 → 借方 100 現金 / 貸方 400 売上高
        </p>
      </section>

      <section className="rounded-xl border border-border/60 bg-card/70 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">日付</th>
                <th className="px-3 py-2 font-medium">借方コード</th>
                <th className="px-3 py-2 font-medium">借方科目</th>
                <th className="px-3 py-2 text-right font-medium">借方金額</th>
                <th className="px-3 py-2 font-medium">貸方コード</th>
                <th className="px-3 py-2 font-medium">貸方科目</th>
                <th className="px-3 py-2 text-right font-medium">貸方金額</th>
                <th className="px-3 py-2 font-medium">摘要</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {[...state.journal]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((j) => (
                  <tr
                    key={j.id}
                    className="border-t border-border/60 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{j.date}</td>
                    <td className="px-3 py-2 font-mono text-xs">{j.debitCode}</td>
                    <td className="px-3 py-2">{j.debitAccount}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {j.debitAmount > 0 ? formatJPY(j.debitAmount) : ""}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {j.creditCode}
                    </td>
                    <td className="px-3 py-2">{j.creditAccount}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {j.creditAmount > 0 ? formatJPY(j.creditAmount) : ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {j.description}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          set((s) => ({
                            ...s,
                            journal: s.journal.filter((x) => x.id !== j.id),
                          }))
                        }
                        aria-label="削除"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              {state.journal.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-xs text-muted-foreground"
                  >
                    まだ仕訳がありません。上のフォームから追加してください。
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

/* ------------------------------ Receipts ------------------------------- */

function ReceiptsTab() {
  const [items, setItems] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listReceipts();
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await saveReceipt({
        id: newId(),
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
        blob: file,
      });
    }
    if (fileRef.current) fileRef.current.value = "";
    refresh();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold">レシート保管</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              画像 / PDF をドラッグ&ドロップでアップロード。この端末の IndexedDB に保存されます。
              ブラウザのデータを削除すると消えるので、定期的にバックアップを取ってください。
            </p>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              ファイルを追加
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">読込中…</p>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            まだレシートがありません
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((r) => (
              <ReceiptItem key={r.id} record={r} onDeleted={refresh} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReceiptItem({
  record,
  onDeleted,
}: {
  record: ReceiptRecord;
  onDeleted: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(record.blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [record.blob]);

  const isImage = record.mime.startsWith("image/");

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-background/60">
      <div className="relative aspect-square bg-muted/40">
        {isImage && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={record.name}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageIcon className="size-8 opacity-60" />
            <p className="text-[10px]">{record.mime}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2 text-xs">
        <p className="truncate font-medium">{record.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {(record.size / 1024).toFixed(0)} KB · {record.addedAt.slice(0, 10)}
        </p>
        <div className="mt-1 flex justify-between gap-1">
          <a
            href={url ?? "#"}
            download={record.name}
            className="inline-flex h-6 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-muted"
          >
            <Download className="size-3" /> DL
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={async () => {
              if (confirm(`${record.name} を削除しますか?`)) {
                await deleteReceipt(record.id);
                onDeleted();
              }
            }}
            aria-label="削除"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------- Backup -------------------------------- */

function BackupTab() {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadBackup();
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (file: File | null) => {
    if (!file) return;
    if (
      !confirm(
        "現在のデータ(銀行残高・仕訳帳・レシート等)はすべて上書きされます。続行しますか?",
      )
    )
      return;
    setBusy(true);
    try {
      await restoreFromFile(file);
      alert("復元しました。ページを再読み込みします。");
      location.reload();
    } catch (err) {
      alert(`復元に失敗しました: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-border/60 bg-card/70 p-5 shadow-sm">
      <header className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <h3 className="font-heading text-base font-semibold">
            バックアップ / 復元
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            銀行・クレカ・勤怠・仕訳帳・レシート画像までを1つの JSON ファイルに書き出します。
            別端末で同じデータを使うときや、ブラウザ更新の前に必ずダウンロードしてください。
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={handleDownload} disabled={busy} size="sm">
          <Download className="size-3.5" />
          バックアップをダウンロード
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) =>
            handleRestore(e.target.files?.[0] ?? null).finally(() => {
              if (fileRef.current) fileRef.current.value = "";
            })
          }
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Upload className="size-3.5" />
          バックアップから復元
        </Button>
      </div>
    </section>
  );
}
