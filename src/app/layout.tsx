import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/presentation/components/ui/Button";
import { GlobalHeader } from "@/presentation/components/layout/GlobalHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Partidas Pro - Gestão Esportiva de Elite",
  description: "Plataforma SaaS para organização e gestão de peladas e grupos esportivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-primary/30 selection:text-white">
        <GlobalHeader />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <footer className="py-12 border-t border-white/5 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm text-white/40">&copy; 2026 Partidas Pro. Todos os direitos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
