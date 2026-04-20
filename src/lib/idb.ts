"use client";

/**
 * IndexedDB ラッパー — レシート(画像Blob)を保存。
 *
 * - DB 名: `cuenta-idb` / バージョン: 1
 * - ストア: `receipts` (key: id)
 * - 値: { id, name, mime, size, addedAt, blob, journalEntryId? }
 */

const DB_NAME = "cuenta-idb";
const DB_VERSION = 1;
const RECEIPTS_STORE = "receipts";

export type ReceiptRecord = {
  id: string;
  /** ファイル名 */
  name: string;
  /** MIMEタイプ */
  mime: string;
  /** サイズ(bytes) */
  size: number;
  /** 追加した日時(ISO) */
  addedAt: string;
  /** 画像本体 */
  blob: Blob;
  /** 紐付けた仕訳エントリのID(任意) */
  journalEntryId?: string;
  /** 自由メモ */
  memo?: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable on the server"));
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(RECEIPTS_STORE)) {
          db.createObjectStore(RECEIPTS_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode: IDBTransactionMode) {
  return openDB().then((db) => db.transaction(RECEIPTS_STORE, mode).objectStore(RECEIPTS_STORE));
}

function asPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveReceipt(rec: ReceiptRecord): Promise<void> {
  const store = await tx("readwrite");
  await asPromise(store.put(rec));
}

export async function getReceipt(id: string): Promise<ReceiptRecord | undefined> {
  const store = await tx("readonly");
  return asPromise(store.get(id) as IDBRequest<ReceiptRecord | undefined>);
}

export async function listReceipts(): Promise<ReceiptRecord[]> {
  const store = await tx("readonly");
  const list = await asPromise(store.getAll() as IDBRequest<ReceiptRecord[]>);
  return list.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function deleteReceipt(id: string): Promise<void> {
  const store = await tx("readwrite");
  await asPromise(store.delete(id));
}

export async function clearReceipts(): Promise<void> {
  const store = await tx("readwrite");
  await asPromise(store.clear());
}
