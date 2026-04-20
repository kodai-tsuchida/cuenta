"use client";

import { getRawState, importState } from "./store";
import {
  clearReceipts,
  listReceipts,
  saveReceipt,
  type ReceiptRecord,
} from "./idb";
import type { AppState } from "./types";

type BackupFile = {
  version: 1;
  exportedAt: string;
  state: AppState;
  receipts: Array<
    Omit<ReceiptRecord, "blob"> & {
      /** Base64 エンコードされた画像(data URI ではなく、本体のみ) */
      blobBase64: string;
    }
  >;
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  // chunk して String.fromCharCode に渡す(大きい配列だと stack overflow するため)
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunk, bytes.length)),
    );
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export async function buildBackupJson(): Promise<string> {
  const state = getRawState();
  const receipts = await listReceipts();
  const encoded: BackupFile["receipts"] = await Promise.all(
    receipts.map(async (r) => ({
      id: r.id,
      name: r.name,
      mime: r.mime,
      size: r.size,
      addedAt: r.addedAt,
      journalEntryId: r.journalEntryId,
      memo: r.memo,
      blobBase64: await blobToBase64(r.blob),
    })),
  );

  const file: BackupFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
    receipts: encoded,
  };
  return JSON.stringify(file);
}

export async function downloadBackup() {
  const json = await buildBackupJson();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  a.download = `cuenta-backup-${y}${m}${d}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreFromFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupFile;
  if (parsed.version !== 1 || !parsed.state) {
    throw new Error("バックアップファイルの形式が違います");
  }
  // localStorage 側を復元
  importState(parsed.state);
  // IndexedDB のレシートを全消ししてから復元
  await clearReceipts();
  for (const r of parsed.receipts) {
    await saveReceipt({
      id: r.id,
      name: r.name,
      mime: r.mime,
      size: r.size,
      addedAt: r.addedAt,
      journalEntryId: r.journalEntryId,
      memo: r.memo,
      blob: base64ToBlob(r.blobBase64, r.mime),
    });
  }
}
