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
  Building2,
  Users2,
  Briefcase,
  ShieldCheck,
  QrCode,
  Lock,
  Smartphone,
  MapPin,
  Fingerprint,
  History,
  BarChart3,
  FileSpreadsheet,
  UserX,
  BrainCircuit,
  Building,
  Settings2,
  LogOut
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const s = translations.sidebar;
const c = translations.common;

const navigation = [
  {
    title: s.anaMenu,
    items: [
      { title: c.dashboard, url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: s.operasyon,
    items: [
      { title: s.personnelManagement, url: "/personnel", icon: Users },
      { title: c.attendance, url: "/attendance", icon: Clock },
      { title: s.liveAttendance, url: "/live", icon: Activity },
      { title: c.shifts, url: "/shifts", icon: CalendarClock },
      { title: s.breakRecords, url: "/breaks", icon: Coffee },
    ],
  },
  {
    title: s.talepler,
    items: [
      { title: s.leaveRequests, url: "/leaves", icon: ClipboardList },
      { title: s.advanceRequests, url: "/advances", icon: FileText },
      { title: s.pendingApprovals, url: "/approvals", icon: Bell, badge: "8" },
    ],
  },
  {
    title: s.organizasyon,
    items: [
      { title: c.branches, url: "/branches", icon: Building2 },
      { title: s.depts, url: "/departments", icon: Users2 },
      { title: s.positions, url: "/positions", icon: Briefcase },
      { title: s.roles, url: "/roles", icon: ShieldCheck },
      { title: s.qrPoints, url: "/qr-points", icon: QrCode },
    ],
  },
  {
    title: s.guvenlik,
    items: [
      { title: c.accessControl, url: "/access-control", icon: Lock },
      { title: s.deviceIdManagement, url: "/device-ids", icon: Smartphone },
      { title: s.locationRules, url: "/location-rules", icon: MapPin },
      { title: s.kvkkConsent, url: "/kvkk", icon: Fingerprint },
      { title: s.auditLogs, url: "/audit", icon: History },
    ],
  },
  {
    title: s.analizRapor,
    items: [
      { title: c.reports, url: "/reports", icon: BarChart3 },
      { title: s.overtimeReport, url: "/reports/overtime", icon: FileSpreadsheet },
      { title: s.absenceReport, url: "/reports/absence", icon: UserX },
      { title: c.aiInsights, url: "/ai-insights", icon: BrainCircuit },
    ],
  },
  {
    title: s.sistem,
    items: [
      { title: s.companyInfo, url: "/settings/company", icon: Building },
      { title: s.notificationSettings, url: "/settings/notifications", icon: Bell },
      { title: c.settings, url: "/settings", icon: Settings2 },
    ],
  },
]

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

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-none w-[260px] bg-gradient-to-b from-[#071A2F] to-[#0B2340] text-slate-300"
    >
      <SidebarHeader className="h-[72px] flex flex-row items-center px-4 border-b border-white/5 group">
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
          <SidebarGroup key={group.title} className="mb-4 last:mb-0 p-0">
            <SidebarGroupLabel className="text-[#6F839B] text-[10px] font-extrabold tracking-[1.5px] px-2 mb-2 uppercase h-auto group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className={cn(
                        "h-[40px] rounded-lg px-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center",
                        pathname === item.url 
                          ? "bg-[#123B66] text-white font-semibold relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#EF4444] before:rounded-full" 
                          : "text-[#A8B8CC] hover:bg-[#102F52] hover:text-[#E8F1FF]"
                      )}
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className={cn("w-[18px] h-[18px] shrink-0", pathname === item.url ? "text-[#EF4444]" : "text-inherit")} />
                        <span className="ml-3 truncate text-[13px] group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-[#EF4444] hover:bg-[#EF4444] text-white text-[9px] px-1.5 h-4 min-w-[18px] border-none group-data-[collapsible=icon]:hidden shadow-sm">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 bg-[#051525]/40 border-t border-white/5">
        <div className="flex flex-col gap-2.5 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-white/5 border border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none">
            <Avatar className="h-8 w-8 border border-white/10 shrink-0 shadow-sm">
              <AvatarImage src="https://picsum.photos/seed/admin/200/200" />
              <AvatarFallback className="bg-[#123B66] text-white text-[10px] font-bold">İK</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-[13px] font-bold text-white truncate leading-none">İK Yöneticisi</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] text-[#A8B8CC] font-semibold tracking-wide lowercase">Yönetici • {c.online}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-[#EF4444] hover:text-red-400 text-[13px] font-bold transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">{c.logout}</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
