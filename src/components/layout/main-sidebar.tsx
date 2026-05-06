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
  LogOut,
  ChevronRight
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
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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

export function MainSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-none w-[260px] bg-gradient-to-b from-[#071A2F] to-[#0B2340] text-slate-300"
    >
      <SidebarHeader className="h-[72px] flex flex-row items-center px-4 gap-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] shrink-0 bg-[#EF4444] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-white font-bold text-lg leading-tight tracking-tight">VeriTakip</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">{s.logoSubtitle}</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4 custom-scrollbar">
        {navigation.map((group) => (
          <SidebarGroup key={group.title} className="mb-4">
            <SidebarGroupLabel className="text-[#6F839B] text-[10px] font-bold tracking-[1.5px] px-2 mb-2 uppercase group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className={cn(
                        "h-[44px] rounded-xl px-3 transition-all duration-200 group-data-[collapsible=icon]:justify-center",
                        pathname === item.url 
                          ? "bg-[#123B66] text-white font-semibold relative before:absolute before:left-0 before:top-1/4 before:bottom-1/4 before:w-[3px] before:bg-[#EF4444] before:rounded-full" 
                          : "text-[#A8B8CC] hover:bg-[#102F52] hover:text-[#E8F1FF]"
                      )}
                    >
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className={cn("w-5 h-5 shrink-0", pathname === item.url ? "text-[#EF4444]" : "text-inherit")} />
                        <span className="ml-3 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-[#EF4444] hover:bg-[#EF4444] text-white text-[10px] px-1.5 h-4 min-w-4 border-none group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="p-4 bg-[#051525]/40 border-t border-white/5">
        <div className="flex flex-col gap-3 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center gap-3 p-1.5 rounded-xl bg-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
            <Avatar className="h-9 w-9 border border-white/10 shrink-0">
              <AvatarImage src="https://picsum.photos/seed/admin/200/200" />
              <AvatarFallback className="bg-[#123B66] text-white text-xs">İK</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-white truncate">İK Yöneticisi</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-[#A8B8CC] font-medium">Yönetici • {c.online}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-3 px-3 py-2 text-[#EF4444] hover:text-red-400 text-sm font-semibold transition-colors group-data-[collapsible=icon]:p-0">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">{c.logout}</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
