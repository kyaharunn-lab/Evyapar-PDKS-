"use client"

import * as React from "react"
import { Smartphone } from "lucide-react"

import { MobileExperience } from "../mobile-preview/mobile-experience"
import { loginWithLocalPersonnel, readAuthSession } from "@/lib/auth-session"

export default function MobileAppPage() {
  const [hasSession, setHasSession] = React.useState(false)
  const [authLoading, setAuthLoading] = React.useState(true)

  React.useEffect(() => {
    const refresh = () => {
      const nextHasSession = Boolean(readAuthSession())
      setHasSession((current) => current === nextHasSession ? current : nextHasSession)
      setAuthLoading(false)
    }
    refresh()
    window.addEventListener("app-auth-updated", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("app-auth-updated", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  if (authLoading) {
    return <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950" />
  }

  if (!hasSession) {
    return <NativeMobileLogin onSuccess={() => setHasSession(true)} />
  }

  return <MobileExperience variant="app" />
}

function NativeMobileLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const result = loginWithLocalPersonnel(email, password)
    if (!result.ok) {
      setError(result.error || "Giriş yapılamadı.")
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950 p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.24),transparent_26rem),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.2),transparent_24rem)]" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-[32px] border border-white/10 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/15">
            <Smartphone className="h-8 w-8 text-sky-200" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Evyapar Mobil</h1>
          <p className="mt-2 text-sm font-semibold text-white/55">Personel hesabınızla giriş yapın.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-widest text-white/55">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pointer-events-auto h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none transition focus:border-sky-300/50 focus:bg-white/15 placeholder:text-white/35"
              placeholder="personel@evyapar.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase tracking-widest text-white/55">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pointer-events-auto h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white outline-none transition focus:border-sky-300/50 focus:bg-white/15 placeholder:text-white/35"
              placeholder="Şifreniz"
              required
            />
          </div>
          {error && <div className="rounded-2xl border border-rose-300/20 bg-rose-500/15 px-4 py-3 text-sm font-bold text-rose-100">{error}</div>}
          <button type="submit" className="pointer-events-auto h-12 w-full rounded-2xl bg-white font-black text-slate-950 transition hover:bg-white/90">
            Giriş Yap
          </button>
        </div>
      </form>
    </div>
  )
}
