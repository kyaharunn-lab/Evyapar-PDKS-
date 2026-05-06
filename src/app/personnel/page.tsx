"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  QrCode, 
  Building,
  Briefcase,
  Filter,
  User,
  Eye,
  Edit2,
  Lock,
  Download
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { translations } from "@/lib/translations"

const t = translations.common;
const p = translations.personnel;
const d = translations.depts;
const pos = translations.positions;

const employees = [
  {
    id: "EMP001",
    name: "Ahmet Yılmaz",
    email: "ahmet.y@veritakip.com",
    department: d.logistics,
    position: pos.fleetManager,
    branch: "İstanbul",
    status: t.active,
    workType: p.office,
    avatar: "https://picsum.photos/seed/emp1/200/200"
  },
  {
    id: "EMP002",
    name: "Selin Demir",
    email: "selin.d@veritakip.com",
    department: d.sales,
    position: pos.seniorExec,
    branch: "Ankara",
    status: t.active,
    workType: p.field,
    avatar: "https://picsum.photos/seed/emp2/200/200"
  },
  {
    id: "EMP003",
    name: "Mehmet Aksoy",
    email: "mehmet.a@veritakip.com",
    department: d.it,
    position: pos.sysArch,
    branch: "İstanbul",
    status: t.active,
    workType: p.remote,
    avatar: "https://picsum.photos/seed/emp3/200/200"
  },
  {
    id: "EMP004",
    name: "Ayşe Kaya",
    email: "ayse.k@veritakip.com",
    department: d.hr,
    position: pos.hrSpec,
    branch: "İzmir",
    status: t.inactive,
    workType: p.office,
    avatar: "https://picsum.photos/seed/emp4/200/200"
  },
  {
    id: "EMP005",
    name: "Caner Aydın",
    email: "caner.a@veritakip.com",
    department: d.ops,
    position: pos.siteSuper,
    branch: "Bursa",
    status: t.active,
    workType: p.field,
    avatar: "https://picsum.photos/seed/emp5/200/200"
  }
]

export default function PersonnelPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">{p.title}</h2>
          <p className="text-muted-foreground mt-1 text-base">{p.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-5 border-slate-200 hover:bg-slate-50 transition-colors">
            <QrCode className="mr-2 h-4 w-4" />
            {p.generateIds}
          </Button>
          <Button className="h-11 px-6 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            {p.addEmployee}
          </Button>
        </div>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="pb-6 border-b bg-slate-50/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="relative w-full lg:w-[450px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder={t.search} className="pl-11 h-11 bg-white border-slate-200 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Button variant="outline" size="sm" className="h-11 px-5 border-slate-200">
                <Filter className="mr-2 h-4 w-4" />
                {t.filter}
              </Button>
              <Badge variant="secondary" className="h-11 px-4 rounded-xl text-xs font-bold bg-white border border-slate-200 shadow-sm text-primary">
                {p.totalCount.replace('{count}', '142')}
              </Badge>
              <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-slate-100">
                <Download className="h-5 w-5 text-slate-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="enterprise-table-header">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px] pl-6">{p.avatar}</TableHead>
                <TableHead className="font-bold">{p.name}</TableHead>
                <TableHead className="font-bold">{p.deptPos}</TableHead>
                <TableHead className="font-bold">{p.location}</TableHead>
                <TableHead className="font-bold">{p.workType}</TableHead>
                <TableHead className="font-bold">{t.status}</TableHead>
                <TableHead className="text-right pr-6 font-bold">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
                  <TableCell className="pl-6">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md transition-transform group-hover:scale-105">
                      <AvatarImage src={emp.avatar} alt={emp.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-primary text-base group-hover:text-accent transition-colors">{emp.name}</span>
                      <span className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">{emp.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm font-semibold text-slate-700">
                        <Building className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {emp.department}
                      </div>
                      <div className="flex items-center text-[12px] font-medium text-slate-500">
                        <Briefcase className="mr-2 h-3.5 w-3.5 text-slate-400" />
                        {emp.position}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">
                    <div className="flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2.5"></span>
                      {emp.branch}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase font-bold px-3 py-1 tracking-wider border-slate-200",
                      emp.workType === p.office ? "bg-blue-50 text-blue-700" : 
                      emp.workType === p.field ? "bg-orange-50 text-orange-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {emp.workType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
                        emp.status === t.active ? "badge-aktif" : "badge-pasif"
                      )}
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-200 transition-colors">
                          <MoreHorizontal className="h-5 w-5 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-2xl border-slate-100">
                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t.actions}</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer">
                          <Eye className="mr-3 h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-700">{p.viewProfile}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer">
                          <Edit2 className="mr-3 h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-700">{p.editDetails}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer">
                          <QrCode className="mr-3 h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-700">{p.generateQr}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1.5" />
                        <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer text-accent focus:text-accent focus:bg-accent/5">
                          <Lock className="mr-3 h-4 w-4" />
                          <span className="font-bold">{p.deactivate}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
