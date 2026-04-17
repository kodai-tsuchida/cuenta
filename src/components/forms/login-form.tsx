"use client";

import { useActionState } from "react";

import {
  loginWithPassword,
  type LoginFormState,
} from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginInitialState: LoginFormState = {
  status: "idle",
  message: "",
};

export function LoginForm() {
  const [state, formAction] = useActionState(
    loginWithPassword,
    loginInitialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="password">アプリ用パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Vercel の APP_PASSWORD と同じ値"
          required
        />
      </div>
      <p
        className={`text-sm ${
          state.status === "error" ? "text-red-600" : "text-slate-500"
        }`}
      >
        {state.message || "あなた専用の入口として使います。"}
      </p>
      <SubmitButton>ログインする</SubmitButton>
    </form>
  );
}
