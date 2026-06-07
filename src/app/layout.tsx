import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Button } from "@/presentation/components/ui/Button";
import { GlobalHeader } from "@/presentation/components/layout/GlobalHeader";
import { PWARegister } from "@/presentation/components/layout/PWARegister";
import { Logo } from "@/presentation/components/ui/Logo";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Partidas Pro",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050e1f",
  viewportFit: "cover", // iOS: conteúdo alcança as bordas (notch + home bar)
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
        <PWARegister />
        <GlobalHeader />
        <main className="flex-1" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          {children}
        </main>
        <footer className="py-12 border-t border-white/5 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-3">
            <Logo size={26} />
            <p className="text-[11px] text-white/30 font-medium">&copy; 2026 Partidas Pro. Todos os direitos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
