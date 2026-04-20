import { NextResponse } from "next/server";

import {
  APP_STATE_ID,
  APP_STATE_TABLE,
  getSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, state: null }, { status: 200 });
  }
  const sb = getSupabase();
  const { data, error } = await sb
    .from(APP_STATE_TABLE)
    .select("state")
    .eq("id", APP_STATE_ID)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { configured: true, error: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ configured: true, state: data?.state ?? null });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("state" in body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const sb = getSupabase();
  const { error } = await sb.from(APP_STATE_TABLE).upsert({
    id: APP_STATE_ID,
    state: (body as { state: unknown }).state,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
