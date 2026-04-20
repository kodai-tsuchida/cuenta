export type BankAccount = {
  id: string;
  name: string;
  balance: number;
  note?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  /** 毎月の引き落とし日(例: 4, 10) */
  payDay: number;
  /** 当月末締めの利用額(翌月に引き落としされる) */
  currentBilledAmount: number;
  /** さらにその次の月に落ちる予定の利用額(任意) */
  nextBilledAmount: number;
  color?: string;
};

export type ScheduledPayment = {
  id: string;
  name: string;
  amount: number;
  /** YYYY-MM-DD */
  dueDate: string;
  note?: string;
};

export type LoanOut = {
  id: string;
  person: string;
  amount: number;
  /** YYYY-MM-DD */
  dueDate?: string;
  note?: string;
  settled?: boolean;
};

export type TimeEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  start: string;
  end: string;
  /** 休憩(分) */
  breakMinutes: number;
  /** 勤務形態(事務所、Sushi Tech など) */
  workType?: string;
  /** メモ */
  note?: string;
};

/** 通勤路線(往復運賃 × 出勤日数) */
export type CommuteRoute = {
  id: string;
  name: string;
  /** 往復運賃(円) */
  roundTripFare: number;
  /** 既定の路線 */
  isDefault?: boolean;
};

/** 会社へ請求する経費(交通費以外) */
export type CroslanExpense = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  name: string;
  amount: number;
  note?: string;
};

/** 仕訳帳エントリ(青色申告用) */
export type JournalEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  debitCode: string;
  debitAccount: string;
  debitAmount: number;
  creditCode: string;
  creditAccount: string;
  creditAmount: number;
  description: string;
  /** IndexedDB 上のレシートID(任意) */
  receiptId?: string;
};

/** 既定の振込先・発行者情報など */
export type InvoiceSettings = {
  issuerName: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;
  bankName: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  accountHolder: string;
  /** 取引先(請求先) */
  clientName: string;
  /** 備考(箇条書き) */
  notes: string[];
  /** 連番のスタート値(例: 11) */
  nextInvoiceNumber: number;
};

export type AppState = {
  banks: BankAccount[];
  /** 手持ち現金(銀行口座とは別) */
  cashOnHand: number;
  cards: CreditCard[];
  upcoming: ScheduledPayment[];
  loans: LoanOut[];
  timeEntries: TimeEntry[];
  /** 時給(円) */
  hourlyRate: number;
  /** 給与支払日(毎月何日) */
  salaryPayDay: number;
  /** カレンダー一括入力の既定値 */
  defaultStart: string;
  defaultEnd: string;
  defaultBreakMinutes: number;
  defaultWorkType: string;
  /** 通勤路線 */
  commuteRoutes: CommuteRoute[];
  /** CROSLAN への経費(交通費以外) */
  croslanExpenses: CroslanExpense[];
  /** 請求書発行に使う設定 */
  invoiceSettings: InvoiceSettings;
  /** 仕訳帳(ゾウさん開発) */
  journal: JournalEntry[];
  /** ロードマップ */
  roadTo100Entries: RoadTo100Entry[];
  /** YYYY-MM-DD (期限) */
  roadTo100Deadline: string;
  /** 目標金額(円) */
  roadTo100Goal: number;
  /** Road to 100 対象のカードID(通常は AMEX プラチナ) */
  roadTo100CardId?: string;
};

export type RoadTo100Entry = {
  id: string;
  name: string;
  amount: number;
  /** true = まだ確定していない予測 / false = 確定済みの利用分 */
  expected: boolean;
  /** YYYY-MM-DD (任意) */
  date?: string;
  note?: string;
};
