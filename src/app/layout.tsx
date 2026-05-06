import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { translations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

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
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-[#F8F9FC]">
            <MainSidebar />
            <SidebarInset className="bg-transparent">
              <header className="glass-header h-20 flex shrink-0 items-center gap-2 px-8">
                <div className="flex-1">
                  <h1 className="text-xl font-extrabold text-primary tracking-tight">{h.portalTitle}</h1>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-extrabold text-primary leading-tight">{h.role}</p>
                    <Badge variant="outline" className="mt-1 h-5 text-[9px] uppercase font-bold tracking-widest bg-accent/5 text-accent border-accent/20 border-dashed px-2">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {h.accessType}
                    </Badge>
                  </div>
                  <div className="relative group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center text-white font-extrabold cursor-pointer group-hover:scale-105 transition-all duration-300">
                      İK
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#F8F9FC] rounded-full shadow-sm"></div>
                  </div>
                </div>
              </header>
              <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
