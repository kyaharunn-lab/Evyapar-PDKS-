"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp, 
  MapPin,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const attendanceData = [
  { day: "Mon", present: 124, late: 12, absent: 4 },
  { day: "Tue", present: 118, late: 15, absent: 7 },
  { day: "Wed", present: 132, late: 8, absent: 0 },
  { day: "Thu", present: 128, late: 10, absent: 2 },
  { day: "Fri", present: 110, late: 25, absent: 5 },
  { day: "Sat", present: 45, late: 5, absent: 2 },
  { day: "Sun", present: 32, late: 2, absent: 1 },
]

const branchData = [
  { name: "HQ - Istanbul", value: 85, color: "#0E2B4D" },
  { name: "Ankara Branch", value: 42, color: "#CC0000" },
  { name: "Izmir Regional", value: 38, color: "#455A64" },
  { name: "Bursa Facility", value: 25, color: "#1A237E" },
]

const flowData = [
  { time: "07:00", count: 12 },
  { time: "08:00", count: 45 },
  { time: "09:00", count: 142 },
  { time: "10:00", count: 35 },
  { time: "11:00", count: 18 },
  { time: "12:00", count: 22 },
  { time: "13:00", count: 15 },
  { time: "14:00", count: 12 },
  { time: "15:00", count: 10 },
  { time: "16:00", count: 28 },
  { time: "17:00", count: 115 },
  { time: "18:00", count: 52 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard Analytics</h2>
        <p className="text-muted-foreground">Real-time overview of personnel attendance across all branches.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              92% attendance rate
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex items-center text-xs text-accent">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              8% of total shifts
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absenteeism</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -1.2% from average
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Weekly Attendance Flow</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="present" fill="#0E2B4D" radius={[4, 4, 0, 0]} name="Present" />
                  <Bar dataKey="late" fill="#CC0000" radius={[4, 4, 0, 0]} name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Branch Distribution</CardTitle>
            <CardDescription>Active personnel by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={branchData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {branchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {branchData.map((branch) => (
                <div key={branch.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: branch.color }}></div>
                    <span>{branch.name}</span>
                  </div>
                  <span className="font-semibold">{branch.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Entry/Exit Traffic</CardTitle>
            <CardDescription>Today's hourly peak times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData}>
                  <defs>
                    <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0E2B4D" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0E2B4D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="count" stroke="#0E2B4D" fillOpacity={1} fill="url(#colorFlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Recent Field Check-ins</CardTitle>
            <CardDescription>GPS-verified remote attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Ahmet Yılmaz", location: "Construction Site B", time: "08:15 AM", type: "Field" },
                { name: "Selin Demir", location: "Client Office - Levent", time: "09:02 AM", type: "Remote" },
                { name: "Caner Aydın", location: "Logistics Hub North", time: "09:45 AM", type: "Field" },
                { name: "Merve Kaya", location: "Mobile Sales Route 1", time: "10:10 AM", type: "Field" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{item.time}</p>
                    <Badge variant="outline" className="text-[10px] uppercase h-5">{item.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}