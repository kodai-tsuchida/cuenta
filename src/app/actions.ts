"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hasValidPersonalSession } from "@/lib/auth";
import { getMinutesBetween } from "@/lib/cuenta-data";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";

export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialSuccessState: FormState = {
  status: "success",
  message: "保存しました。",
};

function missingSupabaseState(): FormState {
  return {
    status: "error",
    message:
      "Supabase が未設定です。`.env.local` の URL / anon key / service role key を入力してください。",
  };
}

const transactionSchema = z.object({
  transactionDate: z.string().min(1),
  title: z.string().min(1, "内容を入力してください。"),
  counterparty: z.string().min(1, "相手先を入力してください。"),
  amount: z.coerce.number().int().positive("金額は1円以上にしてください。"),
  kind: z.enum(["income", "expense"]),
  scope: z.enum(["personal", "business"]),
  category: z.string().min(1, "科目を入力してください。"),
  note: z.string().optional(),
});

const loanSchema = z.object({
  person: z.string().min(1, "相手の名前を入力してください。"),
  amount: z.coerce.number().int().positive("金額は1円以上にしてください。"),
  direction: z.enum(["lent", "borrowed"]),
  dueDate: z.string().min(1),
  status: z.enum(["open", "settled"]),
  memo: z.string().optional(),
});

const timeEntrySchema = z.object({
  entryDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  work: z.string().min(1, "作業内容を入力してください。"),
  clientName: z.string().min(1, "クライアント名を入力してください。"),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "請求先名を入力してください。"),
  clientAddress: z.string().min(1, "請求先住所を入力してください。"),
  subject: z.string().min(1, "件名を入力してください。"),
  issuedOn: z.string().min(1),
  dueOn: z.string().min(1),
  sellerName: z.string().min(1, "発行者名を入力してください。"),
  sellerEmail: z.string().email("メールアドレスを確認してください。"),
  lineLabel: z.string().min(1, "明細名を入力してください。"),
  quantity: z.coerce.number().positive("数量を入力してください。"),
  unitPrice: z.coerce.number().int().positive("単価を入力してください。"),
  notes: z.string().optional(),
});

function parseStateError(message: string): FormState {
  return {
    status: "error",
    message,
  };
}

export async function createTransaction(
  _previousState: FormState,
  formData: FormData,
) {
  if (!(await hasValidPersonalSession())) {
    return parseStateError("セッションが切れました。再ログインしてください。");
  }

  if (!isSupabaseConfigured()) {
    return missingSupabaseState();
  }

  const parsed = transactionSchema.safeParse({
    transactionDate: formData.get("transactionDate"),
    title: formData.get("title"),
    counterparty: formData.get("counterparty"),
    amount: formData.get("amount"),
    kind: formData.get("kind"),
    scope: formData.get("scope"),
    category: formData.get("category"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return parseStateError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("transactions").insert({
    transaction_date: parsed.data.transactionDate,
    title: parsed.data.title,
    counterparty: parsed.data.counterparty,
    amount: parsed.data.amount,
    kind: parsed.data.kind,
    scope: parsed.data.scope,
    category: parsed.data.category,
    note: parsed.data.note?.trim() ? parsed.data.note : null,
  });

  if (error) {
    return parseStateError(`保存に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  return initialSuccessState;
}

export async function createLoan(_previousState: FormState, formData: FormData) {
  if (!(await hasValidPersonalSession())) {
    return parseStateError("セッションが切れました。再ログインしてください。");
  }

  if (!isSupabaseConfigured()) {
    return missingSupabaseState();
  }

  const parsed = loanSchema.safeParse({
    person: formData.get("person"),
    amount: formData.get("amount"),
    direction: formData.get("direction"),
    dueDate: formData.get("dueDate"),
    status: formData.get("status"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return parseStateError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("loans").insert({
    person: parsed.data.person,
    amount: parsed.data.amount,
    direction: parsed.data.direction,
    due_date: parsed.data.dueDate,
    status: parsed.data.status,
    memo: parsed.data.memo?.trim() ? parsed.data.memo : null,
  });

  if (error) {
    return parseStateError(`保存に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  return initialSuccessState;
}

export async function createTimeEntry(
  _previousState: FormState,
  formData: FormData,
) {
  if (!(await hasValidPersonalSession())) {
    return parseStateError("セッションが切れました。再ログインしてください。");
  }

  if (!isSupabaseConfigured()) {
    return missingSupabaseState();
  }

  const parsed = timeEntrySchema.safeParse({
    entryDate: formData.get("entryDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    work: formData.get("work"),
    clientName: formData.get("clientName"),
  });

  if (!parsed.success) {
    return parseStateError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
  }

  const durationMinutes = getMinutesBetween(
    parsed.data.startTime,
    parsed.data.endTime,
  );

  if (durationMinutes <= 0) {
    return parseStateError("終了時間は開始時間より後にしてください。");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("time_entries").insert({
    entry_date: parsed.data.entryDate,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    work: parsed.data.work,
    client_name: parsed.data.clientName,
    duration_minutes: durationMinutes,
  });

  if (error) {
    return parseStateError(`保存に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  return initialSuccessState;
}

export async function createInvoiceDraft(
  _previousState: FormState,
  formData: FormData,
) {
  if (!(await hasValidPersonalSession())) {
    return parseStateError("セッションが切れました。再ログインしてください。");
  }

  if (!isSupabaseConfigured()) {
    return missingSupabaseState();
  }

  const parsed = invoiceSchema.safeParse({
    clientName: formData.get("clientName"),
    clientAddress: formData.get("clientAddress"),
    subject: formData.get("subject"),
    issuedOn: formData.get("issuedOn"),
    dueOn: formData.get("dueOn"),
    sellerName: formData.get("sellerName"),
    sellerEmail: formData.get("sellerEmail"),
    lineLabel: formData.get("lineLabel"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return parseStateError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
  }

  const supabase = createSupabaseAdminClient();
  const invoiceNumber = `CUENTA-${parsed.data.issuedOn.replaceAll("-", "")}-${Date.now()
    .toString()
    .slice(-4)}`;

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      issued_on: parsed.data.issuedOn,
      due_on: parsed.data.dueOn,
      invoice_number: invoiceNumber,
      seller_name: parsed.data.sellerName,
      seller_email: parsed.data.sellerEmail,
      client_name: parsed.data.clientName,
      client_address: parsed.data.clientAddress,
      subject: parsed.data.subject,
      notes: parsed.data.notes?.trim() ? parsed.data.notes : null,
      status: "draft",
    })
    .select("id")
    .single<{ id: string }>();

  if (invoiceError || !invoiceRow) {
    return parseStateError(
      `請求書の保存に失敗しました: ${invoiceError?.message ?? "unknown error"}`,
    );
  }

  const { error: lineError } = await supabase.from("invoice_lines").insert({
    invoice_id: invoiceRow.id,
    label: parsed.data.lineLabel,
    quantity: parsed.data.quantity,
    unit_price: parsed.data.unitPrice,
  });

  if (lineError) {
    return parseStateError(`明細の保存に失敗しました: ${lineError.message}`);
  }

  revalidatePath("/");
  revalidatePath("/invoice/preview");

  return {
    status: "success",
    message: `請求書を保存しました。番号: ${invoiceNumber}`,
  } satisfies FormState;
}
