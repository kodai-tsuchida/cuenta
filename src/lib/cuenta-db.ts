import {
  formatCurrency,
  getBusinessExpenseByCategory,
  getBusinessExpenseByMonth,
  getCurrentMonthKey,
  getDashboardTotals,
  getInvoiceTotal,
  sampleInvoice,
  sampleLoans,
  sampleTimeEntries,
  sampleTransactions,
  type Invoice,
  type Loan,
  type TimeEntry,
  type Transaction,
} from "@/lib/cuenta-data";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

type TransactionRow = {
  id: string;
  transaction_date: string;
  title: string;
  counterparty: string;
  amount: number;
  kind: Transaction["kind"];
  scope: Transaction["scope"];
  category: string;
  note: string | null;
};

type LoanRow = {
  id: string;
  person: string;
  amount: number;
  direction: Loan["direction"];
  due_date: string;
  status: Loan["status"];
  memo: string | null;
};

type TimeEntryRow = {
  id: string;
  entry_date: string;
  start_time: string;
  end_time: string;
  work: string;
  client_name: string;
  duration_minutes: number;
};

type InvoiceRow = {
  id: string;
  issued_on: string;
  due_on: string;
  invoice_number: string;
  seller_name: string;
  seller_email: string;
  client_name: string;
  client_address: string;
  subject: string;
  notes: string | null;
  status: string;
};

type InvoiceLineRow = {
  id: string;
  invoice_id: string;
  label: string;
  quantity: number;
  unit_price: number;
};

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.transaction_date,
    title: row.title,
    counterparty: row.counterparty,
    amount: row.amount,
    kind: row.kind,
    scope: row.scope,
    category: row.category,
    note: row.note ?? undefined,
  };
}

function mapLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    person: row.person,
    amount: row.amount,
    direction: row.direction,
    dueDate: row.due_date,
    status: row.status,
    memo: row.memo ?? "",
  };
}

function mapTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    date: row.entry_date,
    start: row.start_time.slice(0, 5),
    end: row.end_time.slice(0, 5),
    work: row.work,
    client: row.client_name,
  };
}

async function fetchLatestInvoiceFromSupabase() {
  const supabase = createSupabaseAdminClient();

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .select(
      "id, issued_on, due_on, invoice_number, seller_name, seller_email, client_name, client_address, subject, notes, status",
    )
    .order("issued_on", { ascending: false })
    .limit(1)
    .maybeSingle<InvoiceRow>();

  if (invoiceError || !invoiceRow) {
    return sampleInvoice;
  }

  const { data: lineRows, error: linesError } = await supabase
    .from("invoice_lines")
    .select("id, invoice_id, label, quantity, unit_price")
    .eq("invoice_id", invoiceRow.id)
    .order("created_at", { ascending: true })
    .returns<InvoiceLineRow[]>();

  if (linesError) {
    return sampleInvoice;
  }

  return {
    id: invoiceRow.id,
    issuedOn: invoiceRow.issued_on,
    dueOn: invoiceRow.due_on,
    invoiceNumber: invoiceRow.invoice_number,
    sellerName: invoiceRow.seller_name,
    sellerEmail: invoiceRow.seller_email,
    clientName: invoiceRow.client_name,
    clientAddress: invoiceRow.client_address,
    subject: invoiceRow.subject,
    notes: invoiceRow.notes ? invoiceRow.notes.split("\n") : [],
    lines: lineRows.map((line) => ({
      id: line.id,
      label: line.label,
      quantity: line.quantity,
      unitPrice: line.unit_price,
    })),
  } satisfies Invoice;
}

export async function getCuentaDashboardData() {
  if (!isSupabaseConfigured()) {
    const monthKey = getCurrentMonthKey();

    return {
      transactions: sampleTransactions,
      loans: sampleLoans,
      timeEntries: sampleTimeEntries,
      invoice: sampleInvoice,
      monthKey,
      totals: getDashboardTotals(
        sampleTransactions,
        sampleLoans,
        sampleTimeEntries,
        monthKey,
      ),
      businessByCategory: getBusinessExpenseByCategory(sampleTransactions),
      businessByMonth: getBusinessExpenseByMonth(sampleTransactions),
      source: "sample" as const,
      setupMessage:
        "`.env.local` に Supabase の URL / anon key / service role key を設定すると実データ表示に切り替わります。",
    };
  }

  const supabase = createSupabaseAdminClient();

  const [transactionsResult, loansResult, timeEntriesResult, invoice] =
    await Promise.all([
      supabase
        .from("transactions")
        .select(
          "id, transaction_date, title, counterparty, amount, kind, scope, category, note",
        )
        .order("transaction_date", { ascending: false })
        .limit(20)
        .returns<TransactionRow[]>(),
      supabase
        .from("loans")
        .select("id, person, amount, direction, due_date, status, memo")
        .order("due_date", { ascending: true })
        .limit(12)
        .returns<LoanRow[]>(),
      supabase
        .from("time_entries")
        .select(
          "id, entry_date, start_time, end_time, work, client_name, duration_minutes",
        )
        .order("entry_date", { ascending: false })
        .limit(20)
        .returns<TimeEntryRow[]>(),
      fetchLatestInvoiceFromSupabase(),
    ]);

  const transactions =
    transactionsResult.data?.map(mapTransaction) ?? sampleTransactions;
  const loans = loansResult.data?.map(mapLoan) ?? sampleLoans;
  const timeEntries = timeEntriesResult.data?.map(mapTimeEntry) ?? sampleTimeEntries;
  const monthKey =
    transactions[0]?.date.slice(0, 7) ??
    sampleTransactions[0]?.date.slice(0, 7) ??
    getCurrentMonthKey();

  return {
    transactions,
    loans,
    timeEntries,
    invoice,
    monthKey,
    totals: getDashboardTotals(transactions, loans, timeEntries, monthKey),
    businessByCategory: getBusinessExpenseByCategory(transactions),
    businessByMonth: getBusinessExpenseByMonth(transactions),
    source: "supabase" as const,
    setupMessage: `Supabase connected. Latest invoice total: ${formatCurrency(
      getInvoiceTotal(invoice),
    )}`,
  };
}
