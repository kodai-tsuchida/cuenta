import { connection } from "next/server";

import { PrintButton } from "@/components/forms/print-button";
import { requirePersonalSession } from "@/lib/auth";
import { getCuentaDashboardData } from "@/lib/cuenta-db";
import { formatCurrency, getInvoiceTotal } from "@/lib/cuenta-data";

export default async function InvoicePreviewPage() {
  await connection();
  await requirePersonalSession();

  const { invoice } = await getCuentaDashboardData();
  const invoiceTotal = getInvoiceTotal(invoice);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
      <div className="mesh-panel flex items-center justify-between gap-4 p-4 print:hidden">
        <div>
          <p className="section-kicker">Invoice Preview</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            請求書テンプレート
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            ブラウザの印刷機能から PDF として保存できます。
          </p>
        </div>
        <PrintButton />
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] print:rounded-none print:border-none print:p-0 print:shadow-none">
        <div className="border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-kicker">Cuenta Billing</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                請求書
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                件名: {invoice.subject}
              </p>
            </div>
            <div className="space-y-2 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
              <p>
                請求書番号:
                <span className="ml-2 font-mono text-slate-900">
                  {invoice.invoiceNumber}
                </span>
              </p>
              <p>
                発行日:
                <span className="ml-2 font-mono text-slate-900">
                  {invoice.issuedOn}
                </span>
              </p>
              <p>
                支払期限:
                <span className="ml-2 font-mono text-slate-900">
                  {invoice.dueOn}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 py-8 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="section-kicker">From</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">
              {invoice.sellerName}
            </p>
            <p className="mt-2 text-sm text-slate-600">{invoice.sellerEmail}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="section-kicker">To</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">
              {invoice.clientName}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {invoice.clientAddress}
            </p>
          </div>
        </div>

        <div className="py-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">項目</th>
                  <th className="px-4 py-3 text-right font-medium">数量</th>
                  <th className="px-4 py-3 text-right font-medium">単価</th>
                  <th className="px-4 py-3 text-right font-medium">金額</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-slate-900">{line.label}</td>
                    <td className="px-4 py-4 text-right text-slate-600">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-600">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(line.quantity * line.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="section-kicker">Notes</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {invoice.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
            <p className="section-kicker text-slate-300">Total</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight">
              {formatCurrency(invoiceTotal)}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              消費税や源泉徴収などの細かい項目は、次の段階でフォーム化して追加できます。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
