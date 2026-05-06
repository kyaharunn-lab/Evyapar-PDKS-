"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  GitPullRequest, 
  ShieldCheck, 
  BarChart3, 
  BrainCircuit,
  Settings2,
  LogOut,
  Building2,
  ChevronRight,
  ClipboardList,
  UserPlus,
  MapPin,
  Clock,
  UserX,
  Coffee,
  CalendarDays,
  History,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Lock,
  Smartphone,
  Fingerprint,
  Bell,
  HardDrive,
  Users2,
  Activity,
  UserCircle2
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const s = translations.sidebar;
const c = translations.common;

const navigation = [
  {
    title: s.mainMenu,
    items: [
      {
        title: c.dashboard,
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: s.personnelAttendance,
    items: [
      {
        title: s.personnelAttendance,
        icon: Users,
        badge: null,
        subItems: [
          { title: s.personnelManagement, url: "/personnel" },
          { title: c.attendance, url: "/attendance" },
          { title: s.liveAttendance, url: "/live" },
          { title: s.lateArrivals, url: "/late" },
          { title: s.absenceTracking, url: "/absence" },
          { title: s.breakRecords, url: "/breaks" },
        ]
      },
    ],
  },
  {
    title: s.shiftPlanning,
    items: [
      {
        title: s.shiftPlanning,
        icon: CalendarClock,
        subItems: [
          { title: c.shifts, url: "/shifts" },
          { title: s.weeklyPlan, url: "/weekly-plan" },
          { title: s.shiftAssignment, url: "/assignment" },
          { title: s.shiftChangeRequests, url: "/change-requests" },
          { title: s.holidays, url: "/holidays" },
        ]
      },
    ],
  },
  {
    title: s.requests,
    items: [
      {
        title: s.requests,
        icon: GitPullRequest,
        badge: "8",
        subItems: [
          { title: s.leaveRequests, url: "/leaves" },
          { title: s.advanceRequests, url: "/advances" },
          { title: s.shiftChangeRequests, url: "/shift-changes" },
          { title: s.pendingApprovals, url: "/approvals", badge: "3" },
        ]
      },
    ],
  },
  {
    title: s.orgStructure,
    items: [
      {
        title: s.orgStructure,
        icon: Building2,
        subItems: [
          { title: c.branches, url: "/branches" },
          { title: s.depts, url: "/departments" },
          { title: s.positions, url: "/positions" },
          { title: s.roles, url: "/roles" },
          { title: s.qrPoints, url: "/qr-points" },
        ]
      },
    ],
  },
  {
    title: s.securityControl,
    items: [
      {
        title: s.securityControl,
        icon: ShieldCheck,
        subItems: [
          { title: c.accessControl, url: "/access-control" },
          { title: s.qrManagement, url: "/qr-mgmt" },
          { title: s.deviceIdManagement, url: "/device-ids" },
          { title: s.locationRules, url: "/location-rules" },
          { title: s.kvkkConsent, url: "/kvkk" },
          { title: s.auditLogs, url: "/audit" },
        ]
      },
    ],
  },
  {
    title: s.reportsAnalytics,
    items: [
      {
        title: s.reportsAnalytics,
        icon: BarChart3,
        subItems: [
          { title: s.generalReports, url: "/reports/general" },
          { title: s.personnelReport, url: "/reports/personnel" },
          { title: s.overtimeReport, url: "/reports/overtime" },
          { title: s.absenceReport, url: "/reports/absence" },
          { title: s.leaveReport, url: "/reports/leaves" },
          { title: s.exportData, url: "/export" },
        ]
      },
    ],
  },
  {
    title: s.aiSmart,
    items: [
      {
        title: s.aiSmart,
        icon: BrainCircuit,
        subItems: [
          { title: c.aiInsights, url: "/ai-insights" },
          { title: s.riskAlerts, url: "/ai/risks" },
          { title: s.anomalyDetection, url: "/ai/anomalies" },
          { title: s.performanceSummaries, url: "/ai/performance" },
        ]
      },
    ],
  },
  {
    title: s.systemSettings,
    items: [
      {
        title: s.systemSettings,
        icon: Settings2,
        subItems: [
          { title: c.settings, url: "/settings" },
          { title: s.notificationSettings, url: "/settings/notifications" },
          { title: s.companyInfo, url: "/settings/company" },
          { title: s.licenseInfo, url: "/settings/license" },
          { title: s.userManagement, url: "/settings/users" },
        ]
      },
    ],
  },
]

export function MainSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-2xl bg-sidebar">
      <SidebarHeader className="h-24 flex items-center justify-between px-5">
        <div className="flex items-center gap-4 group-data-[collapsible=icon]:hidden">
          <div className="bg-accent shadow-xl shadow-accent/20 p-2.5 rounded-2xl rotate-3 hover:rotate-0 transition-all duration-500">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tighter text-white leading-none">VeriTakip</span>
            <span className="text-[10px] text-white/50 font-bold tracking-[3px] mt-1.5 uppercase">{s.logoSubtitle}</span>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <div className="bg-accent p-2 rounded-xl shadow-lg shadow-accent/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden text-white/30 hover:text-white transition-colors" />
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-2 custom-scrollbar">
        {navigation.map((group) => (
          <SidebarGroup key={group.title} className="mb-6">
            <SidebarGroupLabel className="text-white/30 text-[10px] font-black tracking-[2px] px-3 mb-3 uppercase group-data-[collapsible=icon]:hidden">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.subItems) {
                    const isParentActive = item.subItems.some(sub => sub.url === pathname)
                    return (
                      <Collapsible
                        key={item.title}
                        defaultOpen={isParentActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton 
                              tooltip={item.title}
                              className={cn(
                                "rounded-xl h-12 px-3 hover:bg-white/5 transition-all duration-300",
                                isParentActive ? "text-white bg-white/5 font-bold" : "text-white/60"
                              )}
                            >
                              <item.icon className="w-5 h-5 shrink-0" />
                              <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.title}</span>
                              {item.badge && (
                                <Badge className="ml-auto bg-accent text-white border-none text-[10px] px-1.5 h-4 min-w-4 flex items-center justify-center group-data-[collapsible=icon]:hidden">
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-4 mt-1 border-l border-white/10 pl-2">
                              {item.subItems.map((sub) => (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton 
                                    asChild 
                                    isActive={pathname === sub.url}
                                    className={cn(
                                      "h-10 rounded-lg transition-all px-4",
                                      pathname === sub.url 
                                        ? "text-white font-bold bg-white/10" 
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                    )}
                                  >
                                    <Link href={sub.url} className="flex items-center justify-between w-full">
                                      <span>{sub.title}</span>
                                      {sub.badge && (
                                        <Badge className="bg-accent text-white text-[9px] px-1 h-3.5 min-w-3.5 flex items-center justify-center">
                                          {sub.badge}
                                        </Badge>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                        className={cn(
                          "rounded-xl h-12 px-3 transition-all duration-300",
                          pathname === item.url 
                            ? "bg-accent text-white font-bold shadow-[0_4px_15px_rgba(204,0,0,0.4)]" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className={cn("w-5 h-5", pathname === item.url ? "text-white" : "text-inherit")} />
                          <span className="ml-3">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-5 border-t border-white/5 bg-black/20">
        <SidebarMenu>
          <SidebarMenuItem className="mb-4 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-4 p-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <Avatar className="h-10 w-10 border-2 border-white/10 shadow-lg">
                <AvatarImage src="https://picsum.photos/seed/admin/200/200" alt="Admin" />
                <AvatarFallback className="bg-primary text-white font-bold">İK</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">İK Yöneticisi</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/20 text-white/60 font-medium">Yönetici</Badge>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] text-green-500/80 font-bold uppercase">{c.online}</span>
                  </div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl h-12 transition-all group-data-[collapsible=icon]:justify-center">
              <LogOut className="w-5 h-5" />
              <span className="font-bold group-data-[collapsible=icon]:hidden">{c.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
