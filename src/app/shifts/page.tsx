"use client"

import * as React from "react"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  ArrowLeftRight,
  Settings2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const shifts = [
  { time: "08:00 - 17:00", name: "Day Shift", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { time: "16:00 - 00:00", name: "Evening Shift", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { time: "00:00 - 08:00", name: "Night Shift", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
]

export default function ShiftsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Shift Management</h2>
          <p className="text-muted-foreground">Plan and assign weekly schedules for all departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings2 className="mr-2 h-4 w-4" />
            Config
          </Button>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            New Shift
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-12 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-bold text-primary">March 11 - March 17, 2024</h3>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">Today</Button>
              <div className="h-8 w-px bg-border mx-2" />
              <Button variant="outline" size="sm">Weekly View</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-7 border-b bg-white">
                {days.map(day => (
                  <div key={day} className="p-4 text-center border-r last:border-r-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{day}</p>
                    <p className="text-xl font-bold text-primary mt-1">
                      {10 + days.indexOf(day)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="divide-y">
                {[
                  { name: "HQ - Operations", staff: 12 },
                  { name: "Field Team A", staff: 8 },
                  { name: "Security Unit 1", staff: 5 },
                  { name: "IT Support", staff: 4 },
                ].map((dept, i) => (
                  <div key={i} className="grid grid-cols-7 bg-[#FBFBFB]">
                    {days.map((_, dayIndex) => (
                      <div key={dayIndex} className="p-3 h-48 border-r last:border-r-0 hover:bg-secondary/30 transition-colors">
                        <div className="flex flex-col gap-2 h-full">
                          {dayIndex < 5 ? (
                            <>
                              <div className={`p-2 rounded-md border text-[10px] ${shifts[0].color} flex flex-col`}>
                                <span className="font-bold">{shifts[0].name}</span>
                                <span className="opacity-80">4 Personnel</span>
                              </div>
                              <div className={`p-2 rounded-md border text-[10px] ${shifts[1].color} flex flex-col`}>
                                <span className="font-bold">{shifts[1].name}</span>
                                <span className="opacity-80">2 Personnel</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground italic">Weekend Reduced</span>
                            </div>
                          )}
                          <Button variant="ghost" className="mt-auto h-6 text-[10px] hover:bg-primary hover:text-white border border-dashed border-primary/20">
                            + Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <ArrowLeftRight className="mr-2 h-5 w-5 text-accent" />
                Shift Change Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { from: "Mehmet Aksoy", to: "Caner Aydın", date: "Mar 14", shift: "Evening", reason: "Family Emergency" },
                { from: "Selin Demir", to: "Ahmet Yılmaz", date: "Mar 15", shift: "Day", reason: "Training" },
              ].map((req, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <Avatar className="w-8 h-8 border-2 border-white">
                        <AvatarFallback>{req.from.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-8 h-8 border-2 border-white">
                        <AvatarFallback>{req.to.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{req.from} → {req.to}</p>
                      <p className="text-xs text-muted-foreground">{req.date} • {req.shift} Shift</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-accent h-8">Decline</Button>
                    <Button variant="outline" size="sm" className="bg-primary text-white hover:bg-primary/90 h-8">Approve</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Clock className="mr-2 h-5 w-5 text-accent" />
                Coverage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-start gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Low Coverage Alert</p>
                    <p className="text-xs">Logistics HQ has only 2 staff members scheduled for March 16th Evening shift.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-start gap-2 text-blue-700">
                  <User className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Unassigned Shift</p>
                    <p className="text-xs">Security Unit 2 Night Shift on March 15th requires 1 more person.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}