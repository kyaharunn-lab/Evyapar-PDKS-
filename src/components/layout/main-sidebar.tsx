"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  ShieldCheck, 
  FileText, 
  BrainCircuit,
  Settings,
  LogOut,
  Building2,
  ChevronLeft
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
import { translations } from "@/lib/translations"
import { cn } from "@/lib/utils"

const t = translations.common;

const navigation = [
  {
    title: t.management,
    items: [
      {
        title: t.dashboard,
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: t.personnel,
        url: "/personnel",
        icon: Users,
      },
      {
        title: t.shifts,
        url: "/shifts",
        icon: CalendarDays,
      },
      {
        title: t.attendance,
        url: "/attendance",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: t.securityAnalysis,
    items: [
      {
        title: t.aiInsights,
        url: "/ai-insights",
        icon: BrainCircuit,
      },
      {
        title: t.accessControl,
        url: "/access-control",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: t.organization,
    items: [
      {
        title: t.branches,
        url: "/branches",
        icon: Building2,
      },
      {
        title: t.reports,
        url: "/reports",
        icon: FileText,
      },
    ],
  },
]

export function MainSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-2xl">
      <SidebarHeader className="h-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <div className="bg-accent shadow-lg shadow-accent/20 p-2 rounded-xl rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-white leading-none">VeriTakip</span>
            <span className="text-[10px] text-white/40 font-medium tracking-[2px] mt-1 uppercase">Enterprise ERP</span>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-full">
          <div className="bg-accent p-1.5 rounded-lg shadow-lg shadow-accent/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden text-white/40 hover:text-white" />
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {navigation.map((group) => (
          <SidebarGroup key={group.title} className="mb-4">
            <SidebarGroupLabel className="text-white/30 text-[10px] font-bold tracking-[1.5px] px-2 mb-2 uppercase">
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
                        "rounded-xl h-11 px-3 transition-all duration-300",
                        pathname === item.url 
                          ? "bg-accent text-white font-bold shadow-[0_4px_12px_rgba(204,0,0,0.3)]" 
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn("w-5 h-5", pathname === item.url ? "text-white" : "text-inherit")} />
                        <span className="ml-2">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 bg-black/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-white/5 text-white/60 hover:text-white rounded-xl h-10 transition-colors">
              <Settings className="w-4 h-4" />
              <span>{t.settings}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl h-10 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
