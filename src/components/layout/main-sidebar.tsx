"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Activity, 
  CalendarClock, 
  Coffee,
  ClipboardList,
  FileText,
  Bell,
  ShieldCheck,
  Fingerprint,
  History,
  BarChart3,
  BrainCircuit,
  Settings2,
  LogOut,
  ChevronDown,
  Network,
  KeyRound
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const s = translations.sidebar;
const c = translations.common;

const navigation = [
  {
    title: "ANA MENÜ",
    items: [
      { title: "Ana Panel", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "OPERASYON",
    items: [
      { title: "Personel Yönetimi", url: "/personnel", icon: Users },
      { title: "Giriş / Çıkış Kayıtları", url: "/attendance", icon: Clock },
      { title: "Canlı İçeride Listesi", url: "/live", icon: Activity },
      { title: "Vardiya Yönetimi", url: "/shifts", icon: CalendarClock },
      { title: "Mola Kayıtları", url: "/breaks", icon: Coffee },
    ],
  },
  {
    title: "TALEPLER",
    items: [
      { title: "İzin Talepleri", url: "/leaves", icon: ClipboardList },
      { title: "Avans Talepleri", url: "/advances", icon: FileText },
      { title: "Onay Bekleyenler", url: "/approvals", icon: Bell, badge: "8" },
    ],
  },
  {
    title: "ORGANİZASYON",
    items: [
      { title: "Organizasyon Yapısı", url: "/organization", icon: Network, activePaths: ["/organization", "/branches", "/departments", "/positions"] },
      { title: "Yetki & Erişim Yönetimi", url: "/access-management", icon: KeyRound, activePaths: ["/access-management", "/roles", "/access-control"] },
      { title: "Doğrulama Kuralları", url: "/verification", icon: ShieldCheck, activePaths: ["/verification", "/qr-points", "/device-ids", "/location-rules"] },
    ],
  },
  {
    title: "GÜVENLİK",
    items: [
      { title: "KVKK Onayları", url: "/kvkk", icon: Fingerprint },
      { title: "Denetim Logları", url: "/audit", icon: History },
    ],
  },
  {
    title: "ANALİZ & RAPOR",
    items: [
      { title: "Raporlar", url: "/reports", icon: BarChart3, activePaths: ["/reports", "/reports/overtime", "/reports/absence"] },
      { title: "Yapay Zekâ Analizleri", url: "/ai-insights", icon: BrainCircuit },
    ],
  },
  {
    title: "SİSTEM",
    items: [
      { title: "Ayarlar", url: "/settings", icon: Settings2, activePaths: ["/settings", "/settings/company", "/settings/notifications"] },
    ],
  },
]

function isItemActive(pathname: string, item: { url: string; activePaths?: string[] }) {
  const paths = item.activePaths || [item.url]
  return paths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)))
}

function EvyaparLogo() {
  return (
    <div className="relative flex items-center justify-center w-[42px] h-[42px] bg-gradient-to-br from-[#EF4444] to-[#B91C1C] rounded-xl shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
      {/* Abstract Monogram "E" and Access Symbol */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7 text-white"
      >
        <path
          d="M6 6H18V8H8V11H16V13H8V16H18V18H6V6Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        <path
          opacity="0.3"
          d="M4 4V20H20V4H4ZM2 2H22V22H2V2Z"
          fill="white"
        />
      </svg>
      {/* Gloss effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </div>
  )
}

export function MainSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const activeGroups = React.useMemo(() => {
    return navigation.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.title] = group.items.some((item) => isItemActive(pathname, item))
      return acc
    }, {})
  }, [pathname])
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setOpenGroups((current) => ({ ...current, ...activeGroups }))
  }, [activeGroups])

  return (
    <Sidebar
      collapsible="icon"
      className="border-none w-[260px] bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.28),transparent_28rem),linear-gradient(180deg,#050816_0%,#071426_48%,#020617_100%)] text-slate-300 shadow-2xl shadow-slate-950/30"
    >
      <SidebarHeader className="h-[78px] flex flex-row items-center px-4 border-b border-white/10 group">
        <Link href="/dashboard" className="flex items-center gap-3 w-full">
          <EvyaparLogo />
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-white font-extrabold text-[19px] leading-none tracking-tight">
              Evyapar
            </span>
            <span className="text-[10px] text-slate-400 font-bold tracking-[0.1em] mt-1.5 uppercase">
              {s.logoSubtitle}
            </span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4 custom-scrollbar">
        {navigation.map((group) => (
          <Collapsible
            key={group.title}
            open={state === "collapsed" ? true : openGroups[group.title] ?? activeGroups[group.title] ?? group.title === "ANA MENÜ"}
            onOpenChange={(open) => setOpenGroups((current) => ({ ...current, [group.title]: open }))}
          >
            <SidebarGroup className="mb-2.5 last:mb-0 p-0">
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className={cn(
                  "group/category flex h-8 cursor-pointer items-center justify-between rounded-xl px-2 text-[10px] font-extrabold uppercase tracking-[1.6px] transition-all",
                  activeGroups[group.title] ? "text-sky-200 bg-white/[0.05]" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300",
                  "group-data-[collapsible=icon]:hidden"
                )}>
                  <span>{group.title}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", (openGroups[group.title] ?? activeGroups[group.title]) && "rotate-180")} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {group.items.map((item) => {
                      const active = isItemActive(pathname, item)
                      const badge = "badge" in item ? item.badge : undefined
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={item.title}
                            className={cn(
                              "h-[40px] rounded-xl px-3 transition-all duration-300 group-data-[collapsible=icon]:justify-center",
                              active
                                ? "bg-white/12 text-white font-semibold shadow-[0_12px_35px_-18px_rgba(99,102,241,0.9)] ring-1 ring-white/10 relative before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:bg-gradient-to-b before:from-sky-400 before:to-violet-400 before:rounded-full after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-r after:from-indigo-500/15 after:to-sky-500/10 after:pointer-events-none"
                                : "text-slate-400 hover:bg-white/8 hover:text-white hover:translate-x-0.5"
                            )}
                          >
                            <Link href={item.url} className="flex items-center w-full">
                              <item.icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", active ? "text-sky-300 drop-shadow" : "text-inherit")} />
                              <span className="ml-3 truncate text-[13px] group-data-[collapsible=icon]:hidden">{item.title}</span>
                              {badge && (
                                <Badge className="ml-auto bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-500 hover:to-orange-400 text-white text-[9px] px-1.5 h-4 min-w-[18px] border-none group-data-[collapsible=icon]:hidden shadow-lg shadow-rose-500/25">
                                  {badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 bg-white/[0.03] border-t border-white/10">
        <div className="flex flex-col gap-2.5 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/8 border border-white/10 shadow-inner shadow-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none">
            <Avatar className="h-9 w-9 border border-white/15 shrink-0 shadow-lg shadow-black/20">
              <AvatarImage src="https://picsum.photos/seed/admin/200/200" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-[10px] font-bold">İK</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-[13px] font-bold text-white truncate leading-none">İK Yöneticisi</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-[#A8B8CC] font-semibold tracking-wide lowercase">Yönetici • {c.online}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-rose-300 hover:text-white hover:bg-white/8 rounded-xl text-[13px] font-bold transition-all group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">{c.logout}</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
