import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import { Sidebar } from "@/components/sidebar";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuenta",
  description: "個人のお金・時間・事業を1画面で管理するダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Sidebar />
        <div className="ml-60 flex min-h-screen flex-col">
          <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
