import { NextResponse } from "next/server";

import {
  getSupabase,
  isSupabaseConfigured,
  RECEIPTS_BUCKET,
  RECEIPTS_TABLE,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ receipts: [] });
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from(RECEIPTS_TABLE)
    .select("*")
    .order("added_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ receipts: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }
  const form = await request.formData();
  const file = form.get("file");
  const memo = form.get("memo");
  const journalEntryId = form.get("journalEntryId");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }
  const sb = getSupabase();
  const id = newId();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${id}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const up = await sb.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (up.error) {
    return NextResponse.json({ error: up.error.message }, { status: 500 });
  }
  const { error: insertError } = await sb.from(RECEIPTS_TABLE).insert({
    id,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    path,
    memo: typeof memo === "string" ? memo : null,
    journal_entry_id:
      typeof journalEntryId === "string" && journalEntryId
        ? journalEntryId
        : null,
  });
  if (insertError) {
    await sb.storage.from(RECEIPTS_BUCKET).remove([path]);
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id });
}
