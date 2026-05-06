import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'VeriTakip | Professional Attendance Management',
  description: 'Enterprise-grade personnel attendance and shift management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <MainSidebar />
            <SidebarInset className="bg-[#F8F8F8]">
              <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6">
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-primary">Attendance Management Portal</h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">HR Manager</p>
                    <p className="text-xs text-muted-foreground">Admin Access</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    HR
                  </div>
                </div>
              </header>
              <main className="flex-1 p-6 md:p-8">
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