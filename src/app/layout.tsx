
import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { translations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, CalendarDays, Search, ShieldCheck, Sparkles, SunMedium } from "lucide-react";
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
            <div className="flex min-h-screen w-full bg-[#f5f7fb]">
              <MainSidebar />
              <SidebarInset className="bg-transparent">
                <header className="glass-header h-20 flex shrink-0 items-center gap-4 px-5 md:px-8">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="hidden xl:block min-w-[220px]">
                      <h1 className="text-xl font-extrabold tracking-tight premium-gradient-text">{h.portalTitle}</h1>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Premium PDKS Paneli</p>
                    </div>
                    <div className="relative hidden md:block w-full max-w-xl">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        aria-label="Panelde ara"
                        placeholder="Personel, şube, vardiya veya rapor ara..."
                        className="h-11 rounded-2xl border-white/80 bg-white/80 pl-11 shadow-sm shadow-slate-200/70"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-3.5 py-2 shadow-sm shadow-slate-200/70">
                      <CalendarDays className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-extrabold text-slate-700">
                        {new Intl.DateTimeFormat("tr-TR", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          timeZone: "Europe/Istanbul",
                        }).format(new Date())}
                      </span>
                    </div>
                    <Button variant="outline" size="icon" className="relative hidden sm:inline-flex rounded-2xl bg-white/80">
                      <Bell className="h-4 w-4 text-slate-600" />
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    </Button>
                    <Button variant="outline" size="icon" className="hidden sm:inline-flex rounded-2xl bg-white/80">
                      <SunMedium className="h-4 w-4 text-amber-500" />
                    </Button>
                    <Badge className="hidden md:inline-flex h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 text-white shadow-lg shadow-indigo-500/20">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Premium
                    </Badge>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-extrabold text-primary leading-tight">{h.role}</p>
                      <Badge variant="outline" className="mt-1 h-5 text-[9px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-700 border-emerald-100 px-2">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        {h.accessType}
                      </Badge>
                    </div>
                    <div className="relative group">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center text-white font-extrabold cursor-pointer group-hover:scale-105 transition-all duration-300">
                        İK
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#F8F9FC] rounded-full shadow-sm"></div>
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
