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
  work?: string;
  client?: string;
};

export type BusinessTx = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  counterparty?: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  note?: string;
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

export type AppState = {
  banks: BankAccount[];
  cards: CreditCard[];
  upcoming: ScheduledPayment[];
  loans: LoanOut[];
  timeEntries: TimeEntry[];
  /** 時給(円) */
  hourlyRate: number;
  /** 給与支払日(毎月何日) */
  salaryPayDay: number;
  businessTx: BusinessTx[];
  roadTo100Entries: RoadTo100Entry[];
  /** YYYY-MM-DD (期限) */
  roadTo100Deadline: string;
  /** 目標金額(円) */
  roadTo100Goal: number;
  /** Road to 100 対象のカードID(通常は AMEX プラチナ) */
  roadTo100CardId?: string;
};
