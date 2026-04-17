export type TransactionScope = "personal" | "business";
export type TransactionKind = "income" | "expense";

export type Transaction = {
  id: string;
  date: string;
  title: string;
  counterparty: string;
  amount: number;
  kind: TransactionKind;
  scope: TransactionScope;
  category: string;
  note?: string;
};

export type LoanStatus = "open" | "settled";

export type Loan = {
  id: string;
  person: string;
  amount: number;
  direction: "lent" | "borrowed";
  dueDate: string;
  status: LoanStatus;
  memo: string;
};

export type TimeEntry = {
  id: string;
  date: string;
  start: string;
  end: string;
  work: string;
  client: string;
};

export type InvoiceLine = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  issuedOn: string;
  dueOn: string;
  invoiceNumber: string;
  sellerName: string;
  sellerEmail: string;
  clientName: string;
  clientAddress: string;
  subject: string;
  notes: string[];
  lines: InvoiceLine[];
};

export const sampleTransactions: Transaction[] = [
  {
    id: "tx-001",
    date: "2026-04-02",
    title: "4月分 業務委託報酬",
    counterparty: "Moonlit Studio",
    amount: 185000,
    kind: "income",
    scope: "business",
    category: "売上",
    note: "LP制作と保守対応",
  },
  {
    id: "tx-002",
    date: "2026-04-03",
    title: "食料品",
    counterparty: "ライフ",
    amount: 6480,
    kind: "expense",
    scope: "personal",
    category: "生活費",
  },
  {
    id: "tx-003",
    date: "2026-04-04",
    title: "Adobe Creative Cloud",
    counterparty: "Adobe",
    amount: 6480,
    kind: "expense",
    scope: "business",
    category: "ソフトウェア",
  },
  {
    id: "tx-004",
    date: "2026-04-07",
    title: "電車代",
    counterparty: "JR東日本",
    amount: 1320,
    kind: "expense",
    scope: "business",
    category: "旅費交通費",
  },
  {
    id: "tx-005",
    date: "2026-04-09",
    title: "友人とのランチ",
    counterparty: "Cafe Rill",
    amount: 2400,
    kind: "expense",
    scope: "personal",
    category: "交際費",
  },
  {
    id: "tx-006",
    date: "2026-04-11",
    title: "スマホ通信費",
    counterparty: "楽天モバイル",
    amount: 2980,
    kind: "expense",
    scope: "business",
    category: "通信費",
    note: "事業按分後の金額",
  },
  {
    id: "tx-007",
    date: "2026-04-12",
    title: "書籍購入",
    counterparty: "Amazon",
    amount: 4180,
    kind: "expense",
    scope: "business",
    category: "新聞図書費",
  },
  {
    id: "tx-008",
    date: "2026-04-14",
    title: "家賃",
    counterparty: "管理会社",
    amount: 78000,
    kind: "expense",
    scope: "personal",
    category: "固定費",
  },
  {
    id: "tx-009",
    date: "2026-04-15",
    title: "プリンターインク",
    counterparty: "ヨドバシ",
    amount: 3560,
    kind: "expense",
    scope: "business",
    category: "消耗品費",
  },
  {
    id: "tx-010",
    date: "2026-03-29",
    title: "3月分 業務委託報酬",
    counterparty: "Northwind",
    amount: 142000,
    kind: "income",
    scope: "business",
    category: "売上",
  },
];

export const sampleLoans: Loan[] = [
  {
    id: "loan-001",
    person: "Kenta",
    amount: 12000,
    direction: "lent",
    dueDate: "2026-04-25",
    status: "open",
    memo: "旅行の立替分",
  },
  {
    id: "loan-002",
    person: "Mai",
    amount: 4800,
    direction: "lent",
    dueDate: "2026-04-18",
    status: "open",
    memo: "ライブチケット代",
  },
  {
    id: "loan-003",
    person: "Sho",
    amount: 9000,
    direction: "borrowed",
    dueDate: "2026-04-10",
    status: "settled",
    memo: "撮影機材の共同購入",
  },
];

export const sampleTimeEntries: TimeEntry[] = [
  {
    id: "time-001",
    date: "2026-04-08",
    start: "09:30",
    end: "12:15",
    work: "クライアントA バナー修正",
    client: "Moonlit Studio",
  },
  {
    id: "time-002",
    date: "2026-04-08",
    start: "13:30",
    end: "17:45",
    work: "見積書作成と定例ミーティング",
    client: "Northwind",
  },
  {
    id: "time-003",
    date: "2026-04-10",
    start: "10:00",
    end: "15:30",
    work: "Cuenta 要件整理と画面設計",
    client: "Internal",
  },
  {
    id: "time-004",
    date: "2026-04-14",
    start: "11:00",
    end: "18:20",
    work: "LP 初稿実装",
    client: "Moonlit Studio",
  },
];

export const sampleInvoice: Invoice = {
  id: "invoice-001",
  issuedOn: "2026-04-17",
  dueOn: "2026-04-30",
  invoiceNumber: "CUENTA-2026-0417",
  sellerName: "Tsuchita Koudai",
  sellerEmail: "hello@example.com",
  clientName: "Moonlit Studio合同会社",
  clientAddress: "東京都渋谷区神南1-2-3",
  subject: "Web制作業務委託費",
  notes: [
    "お支払いは銀行振込にてお願いいたします。",
    "振込手数料はご負担をお願いいたします。",
  ],
  lines: [
    {
      id: "line-001",
      label: "LPデザイン・実装",
      quantity: 1,
      unitPrice: 120000,
    },
    {
      id: "line-002",
      label: "保守・改善対応",
      quantity: 1,
      unitPrice: 65000,
    },
  ],
};

export function getMinutesBetween(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${hours}h ${remainder.toString().padStart(2, "0")}m`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentMonthKey() {
  const transactionDates = sampleTransactions.map((transaction) => transaction.date);
  return transactionDates.sort().at(-1)?.slice(0, 7) ?? "2026-04";
}

export function getTransactionsForMonth(
  transactions: Transaction[],
  monthKey = getCurrentMonthKey(),
) {
  return transactions.filter((transaction) =>
    transaction.date.startsWith(monthKey),
  );
}

export function getCurrentMonthTransactions() {
  return getTransactionsForMonth(sampleTransactions);
}

export function getDashboardTotals(
  transactions: Transaction[] = sampleTransactions,
  loans: Loan[] = sampleLoans,
  timeEntries: TimeEntry[] = sampleTimeEntries,
  monthKey = getCurrentMonthKey(),
) {
  const monthlyTransactions = getTransactionsForMonth(transactions, monthKey);

  const personalExpense = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.kind === "expense" && transaction.scope === "personal",
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const businessExpense = monthlyTransactions
    .filter(
      (transaction) =>
        transaction.kind === "expense" && transaction.scope === "business",
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.kind === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const openLoanBalance = loans
    .filter((loan) => loan.status === "open" && loan.direction === "lent")
    .reduce((sum, loan) => sum + loan.amount, 0);

  const trackedMinutes = timeEntries.reduce(
    (sum, entry) => sum + getMinutesBetween(entry.start, entry.end),
    0,
  );

  return {
    personalExpense,
    businessExpense,
    monthlyIncome,
    openLoanBalance,
    trackedMinutes,
  };
}

export function getBusinessExpenseByCategory(
  transactions: Transaction[] = sampleTransactions,
) {
  const bucket = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.scope !== "business" || transaction.kind !== "expense") {
      continue;
    }

    bucket.set(
      transaction.category,
      (bucket.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  return [...bucket.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getBusinessExpenseByMonth(
  transactions: Transaction[] = sampleTransactions,
) {
  const bucket = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.scope !== "business" || transaction.kind !== "expense") {
      continue;
    }

    const month = transaction.date.slice(0, 7);
    bucket.set(month, (bucket.get(month) ?? 0) + transaction.amount);
  }

  return [...bucket.entries()]
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export function getInvoiceTotal(invoice: Invoice) {
  return invoice.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
}
