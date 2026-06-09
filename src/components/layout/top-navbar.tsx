"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, CalendarDays, Check, Command, LogOut, Moon, Search, Settings, ShieldCheck, SunMedium, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { translations } from "@/lib/translations"
import { readCurrentAccess } from "@/lib/access-permissions"
import { cn } from "@/lib/utils"

const h = translations.header

const pageTargets = [
  { label: "Dashboard", href: "/dashboard", type: "Sayfa" },
  { label: "Personeller", href: "/personnel", type: "Sayfa" },
  { label: "Şubeler", href: "/branches", type: "Sayfa" },
  { label: "Vardiyalar", href: "/shifts", type: "Sayfa" },
  { label: "İzin Talepleri", href: "/leave-requests", type: "Sayfa" },
  { label: "Talep Merkezi", href: "/requests", type: "Sayfa" },
  { label: "Giriş / Çıkış", href: "/attendance", type: "Sayfa" },
  { label: "Canlı İçeride", href: "/live", type: "Sayfa" },
  { label: "Bildirimler", href: "/settings/notifications", type: "Sayfa" },
  { label: "Ayarlar", href: "/settings", type: "Sayfa" },
]

function readArray(key: string) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getId(record: any) {
  return String(record?.id || record?.personnelId || record?.branchId || record?.shiftId || record?.code || "")
}

function personName(person: any) {
  return (person?.fullName || person?.personnelName || [person?.firstName || person?.name, person?.lastName || person?.surname].filter(Boolean).join(" ") || person?.email || "Personel").toString()
}

function branchName(branch: any) {
  return (branch?.branchName || branch?.name || branch?.title || "Şube").toString()
}

function shiftName(shift: any) {
  return (shift?.name || shift?.shiftName || shift?.title || "Vardiya").toString()
}

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
}

export function TopNavbar() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [theme, setTheme] = React.useState<"light" | "dark">("light")
  const [access, setAccess] = React.useState<any>(null)

  React.useEffect(() => {
    setAccess(readCurrentAccess())
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light"
    setTheme(currentTheme)
  }, [])

  const searchResults = React.useMemo(() => {
    const term = normalize(query)
    if (!term) return []

    const personnel = readArray("app_personnel").map((person: any) => ({
      label: personName(person),
      detail: person?.email || person?.personnelCode || person?.sicilNo || "Personel",
      href: "/personnel",
      type: "Personel",
      key: `person-${getId(person)}-${personName(person)}`,
    }))
    const branches = readArray("app_branches").map((branch: any) => ({
      label: branchName(branch),
      detail: branch?.city || branch?.address || "Şube",
      href: "/branches",
      type: "Şube",
      key: `branch-${getId(branch)}-${branchName(branch)}`,
    }))
    const shifts = readArray("app_shifts").map((shift: any) => ({
      label: shiftName(shift),
      detail: [shift?.startDate || shift?.date, shift?.startTime, shift?.endTime].filter(Boolean).join(" · ") || "Vardiya",
      href: "/shifts",
      type: "Vardiya",
      key: `shift-${getId(shift)}-${shiftName(shift)}`,
    }))
    const pages = pageTargets.map((page) => ({ ...page, detail: page.href, key: `page-${page.href}` }))

    return [...pages, ...personnel, ...branches, ...shifts]
      .filter((item) => normalize(`${item.label} ${item.detail} ${item.type}`).includes(term))
      .slice(0, 8)
  }, [query])

  const today = new Intl.DateTimeFormat("tr-TR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date())

  const goTo = (href: string) => {
    setQuery("")
    setCalendarOpen(false)
    setProfileOpen(false)
    router.push(href)
  }

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    document.documentElement.classList.toggle("dark", next === "dark")
    window.localStorage.setItem("app_theme", next)
    setTheme(next)
  }

  const logout = () => {
    window.localStorage.removeItem("app_auth_session")
    window.localStorage.removeItem("evyapar_mobile_session")
    setProfileOpen(false)
    router.push("/login")
  }

  const userName = access?.user?.fullName || access?.user?.personnelName || access?.session?.email || h.role
  const initials = userName.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toLocaleUpperCase("tr-TR") || "İK"

  return (
    <header className="relative flex h-[84px] shrink-0 items-center gap-4 overflow-visible border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_30rem),linear-gradient(135deg,#06101f_0%,#101735_48%,#312e81_100%)] px-5 shadow-2xl shadow-slate-300/20 backdrop-blur-xl md:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-8 top-0 h-px w-64 bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
        <div className="absolute right-16 top-3 h-24 w-24 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
        <div className="hidden min-w-[220px] xl:block">
          <h1 className="text-xl font-extrabold tracking-tight text-white">{h.portalTitle}</h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200/70">Enterprise Workforce Suite</p>
        </div>

        <div className="relative hidden w-full max-w-2xl md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-100/60" />
          <Input
            aria-label="Panelde ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) goTo(searchResults[0].href)
            }}
            placeholder="Personel, şube, vardiya veya sayfa ara..."
            className="h-12 rounded-2xl border-white/10 bg-white/10 pl-11 pr-24 text-white shadow-inner shadow-black/10 placeholder:text-slate-300/70 backdrop-blur-xl focus-visible:border-sky-300/60 focus-visible:bg-white/15"
          />
          <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-black text-slate-300 lg:flex">
            <Command className="h-3 w-3" /> K
          </div>
          {query && (
            <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl border border-white/15 bg-[#081225]/95 p-2 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
              {searchResults.length ? searchResults.map((item) => (
                <button key={item.key} onClick={() => goTo(item.href)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-white/10">
                  <span>
                    <span className="block text-sm font-extrabold text-white">{item.label}</span>
                    <span className="block text-xs font-semibold text-sky-100/55">{item.detail}</span>
                  </span>
                  <Badge className="bg-white/10 text-white hover:bg-white/10">{item.type}</Badge>
                </button>
              )) : (
                <div className="px-3 py-4 text-center text-sm font-semibold text-white/55">Sonuç bulunamadı.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 md:gap-3">
        <div className="hidden items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-2 shadow-lg shadow-emerald-500/10 xl:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
          <span className="text-xs font-extrabold text-emerald-100">Sistem Aktif</span>
        </div>

        <div className="relative hidden lg:block">
          <Button onClick={() => setCalendarOpen((value) => !value)} variant="outline" className="h-11 rounded-2xl border-white/10 bg-white/10 px-3.5 text-white shadow-lg shadow-black/10 backdrop-blur-xl hover:bg-white/15">
            <CalendarDays className="mr-2 h-4 w-4 text-sky-200" />
            <span className="text-xs font-extrabold">{today}</span>
          </Button>
          {calendarOpen && (
            <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-white/15 bg-[#081225]/95 p-4 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
              <div className="text-sm font-extrabold">Takvim</div>
              <div className="mt-2 rounded-xl bg-white/10 p-3 text-center">
                <div className="text-3xl font-black">{new Intl.DateTimeFormat("tr-TR", { day: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date())}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-sky-100/60">{today}</div>
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => goTo("/settings/notifications")} variant="outline" size="icon" className="relative hidden rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15 sm:inline-flex">
          <Bell className="h-4 w-4 text-sky-100" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-[#071426]" />
        </Button>

        <Button onClick={toggleTheme} variant="outline" size="icon" className="hidden rounded-2xl border-white/10 bg-white/10 text-white hover:bg-white/15 sm:inline-flex">
          {theme === "dark" ? <Moon className="h-4 w-4 text-sky-100" /> : <SunMedium className="h-4 w-4 text-amber-200" />}
        </Button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-extrabold leading-tight text-white">{userName}</p>
          <Badge variant="outline" className="mt-1 h-5 border-emerald-300/20 bg-emerald-400/10 px-2 text-[9px] font-bold uppercase tracking-widest text-emerald-100">
            <ShieldCheck className="mr-1 h-3 w-3" />
            {h.accessType}
          </Badge>
        </div>

        <div className="relative">
          <button onClick={() => setProfileOpen((value) => !value)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 font-extrabold text-white shadow-xl shadow-sky-500/20 ring-1 ring-white/20 transition-all duration-300 hover:scale-105">
            {initials}
          </button>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-[#071426] bg-emerald-400 shadow-sm" />
          {profileOpen && (
            <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-2xl border border-white/15 bg-[#081225]/95 p-2 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-2xl">
              <button onClick={() => goTo("/personnel")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/10"><UserRound className="h-4 w-4" />Profil</button>
              <button onClick={() => goTo("/settings")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/10"><Settings className="h-4 w-4" />Ayarlar</button>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-500/15"><LogOut className="h-4 w-4" />Çıkış Yap</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

