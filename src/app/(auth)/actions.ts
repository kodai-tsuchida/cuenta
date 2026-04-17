"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearPersonalSession,
  createPersonalSession,
  validateAppPassword,
} from "@/lib/auth";

export type LoginFormState = {
  status: "idle" | "error";
  message: string;
};

const loginSchema = z.object({
  password: z.string().min(1, "パスワードを入力してください。"),
});

export async function loginWithPassword(
  _previousState: LoginFormState,
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
    } satisfies LoginFormState;
  }

  if (!validateAppPassword(parsed.data.password)) {
    return {
      status: "error",
      message: "パスワードが違います。",
    } satisfies LoginFormState;
  }

  await createPersonalSession();
  redirect("/");
}

export async function logout() {
  await clearPersonalSession();
  redirect("/login");
}
