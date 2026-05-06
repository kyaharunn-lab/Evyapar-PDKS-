"use client"

import * as React from "react"
import { 
  Calendar, 
  Search, 
  Download, 
  MapPin, 
  QrCode, 
  UserCircle,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const logs = [
  { id: 1, name: "Ahmet Yılmaz", date: "2024-03-12", in: "07:58 AM", out: "05:05 PM", verify: "Face + QR", status: "On Time", location: "HQ Main Gate" },
  { id: 2, name: "Selin Demir", date: "2024-03-12", in: "09:12 AM", out: "-", verify: "GPS", status: "Late", location: "Client Site - Beşiktaş" },
  { id: 3, name: "Mehmet Aksoy", date: "2024-03-12", in: "08:05 AM", out: "05:15 PM", verify: "QR", status: "On Time", location: "HQ Main Gate" },
  { id: 4, name: "Caner Aydın", date: "2024-03-12", in: "07:45 AM", out: "04:30 PM", verify: "Face", status: "On Time", location: "Bursa Site Entrance" },
  { id: 5, name: "Ayşe Kaya", date: "2024-03-11", in: "08:15 AM", out: "05:00 PM", verify: "Face + QR", status: "On Time", location: "Izmir Regional" },
  { id: 6, name: "Merve Kaya", date: "2024-03-11", in: "08:45 AM", out: "05:30 PM", verify: "GPS", status: "Late", location: "Field Sales Area 4" },
]

export default function AttendanceLogsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Attendance Records</h2>
          <p className="text-muted-foreground">Detailed logs of all entry/exit events with verification data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-green-600 border-green-200 bg-green-50/50 hover:bg-green-50">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 bg-red-50/50 hover:bg-red-50">
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Average Punctuality</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Late Arrival Count</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">14</div>
            <p className="text-[10px] text-muted-foreground">Across all branches</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-black">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">3</div>
            <p className="text-[10px] text-muted-foreground">Manual check required</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Verified Remotes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">28</div>
            <p className="text-[10px] text-muted-foreground">Today's GPS records</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-secondary/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or location..." className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="mr-2 h-4 w-4" />
                Date Range
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-9 px-3 border-dashed">
                <Filter className="mr-2 h-3 w-3" />
                Branch: All
              </Badge>
              <Badge variant="outline" className="h-9 px-3 border-dashed">
                Verification: All
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-transparent">
                <TableHead>Personnel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Exit Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location / Terminal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-md">
                        <UserCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-semibold text-primary">{log.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{log.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      {log.in}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      {log.out}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {log.verify.includes('QR') && <QrCode className="h-3.5 w-3.5" />}
                      {log.verify.includes('GPS') && <MapPin className="h-3.5 w-3.5 text-green-600" />}
                      <span className="text-[10px] font-medium bg-secondary px-1.5 py-0.5 rounded">{log.verify}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {log.status === 'On Time' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-accent" />
                      )}
                      <span className={`text-xs font-semibold ${log.status === 'On Time' ? 'text-green-600' : 'text-accent'}`}>
                        {log.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {log.location}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}