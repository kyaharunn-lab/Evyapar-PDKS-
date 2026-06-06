import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { AccessGuard } from "@/components/layout/access-guard";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";

export const metadata: Metadata = {
  title: 'Evyapar PDKS | Profesyonel Personel Devam Yonetimi',
  description: 'Kurumsal duzeyde personel devam kontrol ve vardiya yonetim sistemi.',
  manifest: '/manifest.json',
  themeColor: '#071426',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Evyapar PDKS',
  },
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/evyapar-icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/evyapar-icon-192.png" />
        <meta name="theme-color" content="#071426" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Evyapar PDKS" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
                <TopNavbar />
                <main className="flex-1 p-5 md:p-8 max-w-[1600px] mx-auto w-full">
                  <AccessGuard>{children}</AccessGuard>
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
