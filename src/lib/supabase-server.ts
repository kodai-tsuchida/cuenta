import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cuenta が触る最小限のスキーマ。tsc を通すために定義しておく */
export type Database = {
  public: {
    Tables: {
      app_state: {
        Row: { id: string; state: unknown; updated_at: string };
        Insert: { id?: string; state: unknown; updated_at?: string };
        Update: Partial<{ id: string; state: unknown; updated_at: string }>;
        Relationships: [];
      };
      receipts: {
        Row: {
          id: string;
          name: string;
          mime: string;
          size: number;
          added_at: string;
          path: string;
          journal_entry_id: string | null;
          memo: string | null;
        };
        Insert: {
          id: string;
          name: string;
          mime: string;
          size: number;
          path: string;
          added_at?: string;
          journal_entry_id?: string | null;
          memo?: string | null;
        };
        Update: Partial<{
          id: string;
          name: string;
          mime: string;
          size: number;
          added_at: string;
          path: string;
          journal_entry_id: string | null;
          memo: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient<Database> | null = null;

/** サーバサイド専用の Supabase クライアント(service_role key で動く) */
export function getSupabase(): SupabaseClient<Database> {
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.",
    );
  }
  if (!cached) {
    cached = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

export const RECEIPTS_BUCKET = "receipts";
export const APP_STATE_TABLE = "app_state";
export const RECEIPTS_TABLE = "receipts";
export const APP_STATE_ID = "singleton";

export function isSupabaseConfigured() {
  return Boolean(url && serviceRoleKey);
}
