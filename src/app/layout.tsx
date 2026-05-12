
import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { translations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, CalendarDays, Command, Search, ShieldCheck, SunMedium, Zap } from "lucide-react";
import { FirebaseClientProvider } from "@/firebase";

const h = translations.header;

export const metadata: Metadata = {
  title: 'Evyapar PDKS | Profesyonel Personel Devam Yönetimi',
  description: 'Kurumsal düzeyde personel devam kontrol ve vardiya yönetim sistemi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Plus Jakarta Sans', sans-serif; }
        `}</style>
      </head>
      <body className="antialiased">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#f3f6fb]">
              <MainSidebar />
              <SidebarInset className="bg-transparent">
                <header className="glass-header h-[84px] flex shrink-0 items-center gap-4 px-5 md:px-8">
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-8 top-0 h-px w-64 bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
                    <div className="absolute right-16 top-3 h-24 w-24 rounded-full bg-indigo-400/20 blur-3xl" />
                    <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:28px_28px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="hidden xl:block min-w-[220px]">
                      <h1 className="text-xl font-extrabold tracking-tight text-white">{h.portalTitle}</h1>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200/70">Enterprise Workforce Suite</p>
                    </div>
                    <div className="relative hidden md:block w-full max-w-2xl">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-100/60" />
                      <Input
                        aria-label="Panelde ara"
                        placeholder="Personel, şube, vardiya veya rapor ara..."
                        className="h-12 rounded-2xl border-white/10 bg-white/10 pl-11 pr-24 text-white shadow-inner shadow-black/10 placeholder:text-slate-300/70 backdrop-blur-xl focus-visible:border-sky-300/50 focus-visible:bg-white/14"
                      />
                      <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300 lg:flex">
                        <Command className="h-3 w-3" /> K
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-2 shadow-lg shadow-emerald-500/10">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)] animate-pulse" />
                      <span className="text-xs font-extrabold text-emerald-100">Sistem Aktif</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2 shadow-lg shadow-black/10 backdrop-blur-xl">
                      <CalendarDays className="h-4 w-4 text-sky-200" />
                      <span className="text-xs font-extrabold text-white">
                        {new Intl.DateTimeFormat("tr-TR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          timeZone: "Europe/Istanbul",
                        }).format(new Date())}
                      </span>
                    </div>
                    <Button variant="outline" size="icon" className="relative hidden sm:inline-flex rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15">
                      <Bell className="h-4 w-4 text-sky-100" />
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#071426]" />
                    </Button>
                    <Button variant="outline" size="icon" className="hidden sm:inline-flex rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15">
                      <SunMedium className="h-4 w-4 text-amber-200" />
                    </Button>
                    <Badge className="hidden md:inline-flex h-10 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-indigo-500/80 via-violet-500/80 to-sky-500/80 px-4 text-white shadow-lg shadow-cyan-500/15 backdrop-blur-xl">
                      <Zap className="mr-2 h-4 w-4" />
                      Live SaaS
                    </Badge>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-extrabold text-white leading-tight">{h.role}</p>
                      <Badge variant="outline" className="mt-1 h-5 border-emerald-300/20 bg-emerald-400/10 px-2 text-[9px] font-bold uppercase tracking-widest text-emerald-100">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {h.accessType}
                      </Badge>
                    </div>
                    <div className="relative group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 shadow-xl shadow-sky-500/20 ring-1 ring-white/20 flex items-center justify-center text-white font-extrabold cursor-pointer group-hover:scale-105 transition-all duration-300">
                        İK
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-4 border-[#071426] rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </header>
                <main className="flex-1 p-5 md:p-8 max-w-[1600px] mx-auto w-full">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
