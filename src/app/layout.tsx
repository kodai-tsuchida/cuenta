import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import { MobileNav } from "@/components/mobile-nav";
import { MobileTopBar } from "@/components/mobile-topbar";
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <MobileTopBar />
        <div className="flex min-h-screen flex-col pb-20 md:ml-60 md:pb-0 print:ml-0 print:pb-0">
          <main className="ro-on-mobile flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8 print:p-0">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
