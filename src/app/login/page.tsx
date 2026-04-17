import { redirect } from "next/navigation";

import { LoginForm } from "@/components/forms/login-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  hasValidPersonalSession,
  isPasswordProtectionEnabled,
} from "@/lib/auth";

export default async function LoginPage() {
  if (!isPasswordProtectionEnabled()) {
    redirect("/");
  }

  if (await hasValidPersonalSession()) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="mesh-panel hero-glow p-8 sm:p-10">
          <Badge className="bg-white/80 text-slate-700" variant="secondary">
            Cuenta Private Access
          </Badge>
          <h1 className="mt-6 max-w-2xl font-heading text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            個人用ダッシュボードに
            <br />
            安全に入るための入口です。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            このアプリは個人運用前提なので、まずは無料で扱いやすいシンプルなパスワード保護を入れています。
            Vercel に設定した `APP_PASSWORD` を入力すると、ダッシュボードに入れます。
          </p>
        </section>

        <Card className="mesh-panel border-white/60 bg-white/85">
          <CardHeader className="space-y-3">
            <span className="section-kicker">Login</span>
            <CardTitle className="text-2xl text-slate-900">
              Cuenta にログイン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
