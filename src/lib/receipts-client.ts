"use client";

export type ReceiptMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  added_at: string;
  path: string;
  journal_entry_id: string | null;
  memo: string | null;
};

export async function listReceipts(): Promise<ReceiptMeta[]> {
  const res = await fetch("/api/receipts", { cache: "no-store" });
  if (!res.ok) throw new Error(`failed to list receipts: ${res.status}`);
  const json = (await res.json()) as { receipts: ReceiptMeta[] };
  return json.receipts ?? [];
}

export async function uploadReceipt(
  file: File,
  extras?: { memo?: string; journalEntryId?: string },
) {
  const form = new FormData();
  form.append("file", file);
  if (extras?.memo) form.append("memo", extras.memo);
  if (extras?.journalEntryId)
    form.append("journalEntryId", extras.journalEntryId);
  const res = await fetch("/api/receipts", { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upload failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function deleteReceipt(id: string) {
  const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete failed: ${res.status}`);
}

/** レシート画像の GET URL(<img src="...">で使う) */
export function receiptSrc(id: string) {
  return `/api/receipts/${id}`;
}
