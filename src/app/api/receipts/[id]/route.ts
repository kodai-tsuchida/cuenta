import { NextResponse } from "next/server";

import {
  getSupabase,
  isSupabaseConfigured,
  RECEIPTS_BUCKET,
  RECEIPTS_TABLE,
} from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const sb = getSupabase();
  const { data, error } = await sb
    .from(RECEIPTS_TABLE)
    .select("path, mime, name")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const file = await sb.storage.from(RECEIPTS_BUCKET).download(data.path);
  if (file.error || !file.data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const ab = await file.data.arrayBuffer();
  return new Response(ab, {
    status: 200,
    headers: {
      "Content-Type": data.mime,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(data.name)}"`,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const sb = getSupabase();
  const { data, error } = await sb
    .from(RECEIPTS_TABLE)
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await sb.storage.from(RECEIPTS_BUCKET).remove([data.path]);
  await sb.from(RECEIPTS_TABLE).delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
