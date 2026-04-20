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
  businessTx: [],
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
    // 足りないフィールドを initialState で補う
    return {
      ...initialState,
      ...parsed,
      banks: parsed.banks ?? initialState.banks,
      cards: parsed.cards ?? initialState.cards,
      upcoming: parsed.upcoming ?? initialState.upcoming,
      loans: parsed.loans ?? initialState.loans,
      timeEntries: parsed.timeEntries ?? initialState.timeEntries,
      businessTx: parsed.businessTx ?? initialState.businessTx,
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
