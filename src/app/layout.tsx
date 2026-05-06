import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { translations } from "@/lib/translations";

const h = translations.header;

export const metadata: Metadata = {
  title: 'VeriTakip | Profesyonel Personel Devam Yönetimi',
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
                  <h1 className="text-xl font-bold text-primary tracking-tight">{h.portalTitle}</h1>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-primary">{h.role}</p>
                    <p className="text-[10px] font-medium text-accent uppercase tracking-wider">{h.accessType}</p>
                  </div>
                  <div className="relative group">
                    <div className="w-11 h-11 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white font-bold cursor-pointer group-hover:scale-105 transition-transform">
                      İK
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </header>
              <main className="flex-1 p-8">
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
