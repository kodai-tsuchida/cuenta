"use client";

import { useSyncExternalStore } from "react";

import type { AppState } from "./types";

const STORAGE_KEY = "cuenta:v1";

export const initialState: AppState = {
  banks: [
    { id: "bank-mufg", name: "三菱UFJ銀行", balance: 0 },
    { id: "bank-sbi", name: "住信SBI銀行", balance: 0 },
  ],
  cards: [
    {
      id: "card-saison-gold",
      name: "セゾンゴールド",
      payDay: 4,
      currentBilledAmount: 0,
      nextBilledAmount: 0,
      color: "#d4af37",
    },
    {
      id: "card-saison-amex",
      name: "セゾンゴールドアメックス",
      payDay: 4,
      currentBilledAmount: 0,
      nextBilledAmount: 0,
      color: "#b8860b",
    },
    {
      id: "card-amex-platinum",
      name: "AMEX プラチナ",
      payDay: 10,
      currentBilledAmount: 0,
      nextBilledAmount: 0,
      color: "#1f2937",
    },
  ],
  upcoming: [],
  loans: [],
  timeEntries: [],
  hourlyRate: 0,
  salaryPayDay: 10,
  defaultStart: "10:00",
  defaultEnd: "19:00",
  defaultBreakMinutes: 60,
  defaultWorkType: "事務所",
  commuteRoutes: [
    {
      id: "route-default",
      name: "家〜会社",
      roundTripFare: 1360,
      isDefault: true,
    },
  ],
  croslanExpenses: [],
  invoiceSettings: {
    issuerName: "土田 航大",
    issuerAddress: "〒634-0007 奈良県橿原市葛本町688-20",
    issuerPhone: "070-2312-6181",
    issuerEmail: "e10481koudai@gmail.com",
    bankName: "三菱UFJ銀行",
    branchName: "橿原支店",
    branchCode: "134",
    accountNumber: "0254324",
    accountHolder: "ツチダ コウダイ",
    clientName: "株式会社CROSLAN",
    notes: [
      "源泉徴収および消費税は考慮しておりません。",
      "振込手数料は貴社ご負担でお願いいたします。",
    ],
    nextInvoiceNumber: 12,
  },
  journal: [],
  roadTo100Entries: [],
  roadTo100Deadline: "2026-07-14",
  roadTo100Goal: 1_000_000,
  roadTo100CardId: "card-amex-platinum",
};

type Listener = () => void;

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<Listener>();

function load(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // 既存ユーザーが古い shape を持っていてもクラッシュしないよう、
    // 足りないフィールドは initialState で補う
    return {
      ...initialState,
      ...parsed,
      banks: parsed.banks ?? initialState.banks,
      cards: parsed.cards ?? initialState.cards,
      upcoming: parsed.upcoming ?? initialState.upcoming,
      loans: parsed.loans ?? initialState.loans,
      timeEntries: (parsed.timeEntries ?? initialState.timeEntries).map(
        (e) => ({
          ...e,
          breakMinutes: e.breakMinutes ?? 0,
        }),
      ),
      commuteRoutes: parsed.commuteRoutes ?? initialState.commuteRoutes,
      croslanExpenses: parsed.croslanExpenses ?? initialState.croslanExpenses,
      invoiceSettings: {
        ...initialState.invoiceSettings,
        ...(parsed.invoiceSettings ?? {}),
      },
      journal: parsed.journal ?? initialState.journal,
      roadTo100Entries: parsed.roadTo100Entries ?? initialState.roadTo100Entries,
    };
  } catch {
    return initialState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function emit() {
  for (const l of listeners) l();
}

function ensureHydrated() {
  if (hydrated) return;
  hydrated = true;
  state = load();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  ensureHydrated();
  return state;
}

function getServerSnapshot(): AppState {
  return initialState;
}

export function setState(next: AppState | ((s: AppState) => AppState)) {
  ensureHydrated();
  state = typeof next === "function" ? (next as (s: AppState) => AppState)(state) : next;
  persist();
  emit();
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** `setState` は常に同じ参照なので、そのまま返す。 */
export function useAppStateSetter() {
  return setState;
}

/** ランダムだが衝突しにくい ID を返す(crypto.randomUUID が使えない環境でも動く) */
export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function resetAppState() {
  setState(initialState);
}

/** 直接 state を取得(バックアップ用) */
export function getRawState(): AppState {
  ensureHydrated();
  return state;
}

/** バックアップから復元 */
export function importState(next: AppState) {
  setState({ ...initialState, ...next });
}
