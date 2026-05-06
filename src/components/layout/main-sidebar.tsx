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
  Building2
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
} from "@/components/ui/sidebar"

const navigation = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Personnel",
        url: "/personnel",
        icon: Users,
      },
      {
        title: "Shift Management",
        url: "/shifts",
        icon: CalendarDays,
      },
      {
        title: "Attendance Logs",
        url: "/attendance",
        icon: ClipboardList,
      },
    ],
  },
  {
    title: "Security & AI",
    items: [
      {
        title: "AI Insights",
        url: "/ai-insights",
        icon: BrainCircuit,
      },
      {
        title: "Access Control",
        url: "/access-control",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Organization",
    items: [
      {
        title: "Branches",
        url: "/branches",
        icon: Building2,
      },
      {
        title: "Reports",
        url: "/reports",
        icon: FileText,
      },
    ],
  },
]

export function MainSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="bg-accent p-1.5 rounded-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">VeriTakip</span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
          <div className="bg-accent p-1.5 rounded-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-white/50">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="hover:bg-sidebar-accent transition-colors"
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-sidebar-accent">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-sidebar-accent text-red-400">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}