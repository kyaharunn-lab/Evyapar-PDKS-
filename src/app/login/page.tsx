"use client"

import * as React from "react"
import { LockKeyhole, LogIn, ShieldCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, useFirestore } from "@/firebase"
import { loginWithLocalPersonnel, readAuthSession } from "@/lib/auth-session"
import { readCurrentAccess } from "@/lib/access-permissions"
import { loginWithFirebasePersonnel } from "@/lib/firebase-auth-personnel"

function getPostLoginPath(access: { panelAccess: boolean; mobileAccess: boolean }) {
  if (access.panelAccess) return "/dashboard"
  if (access.mobileAccess) return "/mobile-app"
  return "/dashboard"
}

export default function LoginPage() {
  const auth = useAuth()
  const db = useFirestore()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (readAuthSession()) {
      window.location.replace(getPostLoginPath(readCurrentAccess()))
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    const firebaseResult = await loginWithFirebasePersonnel(auth, db, email, password)
    if (firebaseResult.ok) {
      setLoading(false)
      const access = readCurrentAccess()
      window.location.replace(getPostLoginPath(access))
      return
    }

    const result = loginWithLocalPersonnel(email, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error || firebaseResult.error || "Giriş yapılamadı.")
      return
    }

    const access = readCurrentAccess()
    window.location.replace(getPostLoginPath(access))
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-[#f3f6fb] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.18),transparent_30rem),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.16),transparent_28rem)]" />
      <Card className="premium-card relative w-full max-w-md overflow-hidden border-none">
        <CardContent className="p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <Badge className="mb-4 rounded-full bg-primary/5 px-3 py-1 text-primary hover:bg-primary/5">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Local Session Auth
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">Evyapar PDKS</h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Personel email ve şifrenizle giriş yapın.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Email</Label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-white"
                placeholder="personel@evyapar.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Şifre</Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-white"
                placeholder="Şifrenizi girin"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-2xl bg-primary text-sm font-extrabold text-white hover:bg-primary/90">
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
