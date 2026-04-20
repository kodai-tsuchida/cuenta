"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { AppState } from "./types";

const STORAGE_KEY = "cuenta:v2";

export const initialState: AppState = {
  banks: [
    { id: "bank-mufg", name: "三菱UFJ銀行", balance: 0 },
    { id: "bank-sbi", name: "住信SBI銀行", balance: 0 },
  ],
  cashOnHand: 0,
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

function normalize(parsed: Partial<AppState>): AppState {
  return {
    ...initialState,
    ...parsed,
    banks: parsed.banks ?? initialState.banks,
    cashOnHand: parsed.cashOnHand ?? 0,
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
}

type Listener = () => void;

let state: AppState = initialState;
let hydrated = false;
const listeners = new Set<Listener>();

/** サーバ同期状況(UI に表示) */
export type SyncStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "offline" };

let syncStatus: SyncStatus = { kind: "idle" };
const statusListeners = new Set<Listener>();

function setStatus(next: SyncStatus) {
  syncStatus = next;
  for (const l of statusListeners) l();
}

function loadFromLocalStorage(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return normalize(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return initialState;
  }
}

function persistLocal() {
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

function ensureHydratedLocal() {
  if (hydrated) return;
  hydrated = true;
  state = loadFromLocalStorage();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  ensureHydratedLocal();
  return state;
}

function getServerSnapshot(): AppState {
  return initialState;
}

function subscribeStatus(listener: Listener) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

function getStatusSnapshot(): SyncStatus {
  return syncStatus;
}

function getStatusServerSnapshot(): SyncStatus {
  return { kind: "idle" };
}

/* -------------------------- サーバ同期の実装 -------------------------- */

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savePromise: Promise<void> | null = null;

async function pushToServer() {
  setStatus({ kind: "saving" });
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    setStatus({ kind: "idle" });
  } catch (err) {
    setStatus({
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

function scheduleSave() {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePromise = pushToServer();
  }, 600);
}

/** 初回フック用: サーバから取得して上書き */
async function hydrateFromServer() {
  setStatus({ kind: "loading" });
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      configured: boolean;
      state: Partial<AppState> | null;
    };
    if (!data.configured) {
      setStatus({ kind: "offline" });
      return;
    }
    // 空なら、現在のローカルキャッシュをサーバに push
    if (!data.state || Object.keys(data.state).length === 0) {
      await pushToServer();
      return;
    }
    state = normalize(data.state);
    persistLocal();
    emit();
    setStatus({ kind: "idle" });
  } catch (err) {
    setStatus({
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

let hydratedFromServer = false;
function hydrateFromServerOnce() {
  if (hydratedFromServer) return;
  hydratedFromServer = true;
  void hydrateFromServer();
}

/* ---------------------------- 公開 API ---------------------------- */

export function setState(next: AppState | ((s: AppState) => AppState)) {
  ensureHydratedLocal();
  state = typeof next === "function" ? (next as (s: AppState) => AppState)(state) : next;
  persistLocal();
  emit();
  scheduleSave();
}

export function useAppState() {
  // レンダ後にサーバから取得(初回だけ)
  useEffect(() => {
    hydrateFromServerOnce();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useAppStateSetter() {
  return setState;
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    subscribeStatus,
    getStatusSnapshot,
    getStatusServerSnapshot,
  );
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
  ensureHydratedLocal();
  return state;
}

/** バックアップから復元 */
export function importState(next: AppState) {
  setState({ ...initialState, ...next });
}

/** 保存中の処理が残っていれば待つ(ページ遷移前) */
export async function flushPendingSaves() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    savePromise = pushToServer();
  }
  if (savePromise) await savePromise;
}
