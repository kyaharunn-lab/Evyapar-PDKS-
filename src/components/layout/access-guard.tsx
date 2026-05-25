"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { LockKeyhole, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ACCESS_STORAGE_KEYS, readCurrentAccess } from "@/lib/access-permissions"

const GUARDED_STORAGE_KEYS = ["app_personnel", "app_roles", "app_auth_session", ...ACCESS_STORAGE_KEYS]

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [access, setAccess] = React.useState(() => readCurrentAccess())
  const isLoginPath = pathname === "/login"
  const isMobileAppPath = pathname === "/mobile-app" || pathname.startsWith("/mobile-app/")

  React.useEffect(() => {
    const refreshAccess = () => setAccess(readCurrentAccess())
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || GUARDED_STORAGE_KEYS.includes(event.key as any)) refreshAccess()
    }

    refreshAccess()
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", refreshAccess)
    window.addEventListener("app-access-updated", refreshAccess)
    window.addEventListener("app-auth-updated", refreshAccess)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", refreshAccess)
      window.removeEventListener("app-access-updated", refreshAccess)
      window.removeEventListener("app-auth-updated", refreshAccess)
    }
  }, [])

  React.useEffect(() => {
    if (isMobileAppPath) return
    if (!isLoginPath && !access.session) router.replace("/login")
    if (!isLoginPath && access.session && !access.panelAccess && access.mobileAccess && !isMobileAppPath) {
      router.replace("/mobile-app")
    }
  }, [access.mobileAccess, access.panelAccess, access.session, isLoginPath, isMobileAppPath, router])

  if (isLoginPath) return <>{children}</>

  if (isMobileAppPath) return <>{children}</>

  if (!access.session) return null

  if (!access.panelAccess && access.mobileAccess) {
    return isMobileAppPath ? <>{children}</> : null
  }

  if (!access.panelAccess) {
    return <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-180px)] items-center justify-center">
      <Card className="premium-card w-full max-w-xl overflow-hidden border-none">
        <CardContent className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <Badge className="mb-4 rounded-full bg-red-50 px-3 py-1 text-red-700 hover:bg-red-50">
            <ShieldAlert className="mr-2 h-3.5 w-3.5" />
            Yetki Kısıtı
          </Badge>
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">Erişim Yetkiniz Yok</h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
            Bu kullanıcı için panel erişimi kapalı. Admin sayfaları erişim yetkisi açılana kadar görüntülenemez.
          </p>
          <Button asChild className="mt-7 rounded-2xl bg-primary px-6 font-bold text-white hover:bg-primary/90">
            <a href="/login">Giriş Ekranına Dön</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
