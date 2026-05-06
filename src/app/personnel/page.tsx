"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  QrCode, 
  Mail, 
  Phone,
  Building,
  Briefcase,
  Filter
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

const employees = [
  {
    id: "EMP001",
    name: "Ahmet Yılmaz",
    email: "ahmet.y@veritakip.com",
    phone: "+90 555 123 4567",
    department: "Logistics",
    position: "Fleet Manager",
    branch: "Istanbul",
    status: "Active",
    workType: "Office",
    avatar: "https://picsum.photos/seed/emp1/200/200"
  },
  {
    id: "EMP002",
    name: "Selin Demir",
    email: "selin.d@veritakip.com",
    phone: "+90 555 987 6543",
    department: "Sales",
    position: "Senior Executive",
    branch: "Ankara",
    status: "Active",
    workType: "Field",
    avatar: "https://picsum.photos/seed/emp2/200/200"
  },
  {
    id: "EMP003",
    name: "Mehmet Aksoy",
    email: "mehmet.a@veritakip.com",
    phone: "+90 555 111 2233",
    department: "IT",
    position: "Systems Architect",
    branch: "Istanbul",
    status: "Active",
    workType: "Remote",
    avatar: "https://picsum.photos/seed/emp3/200/200"
  },
  {
    id: "EMP004",
    name: "Ayşe Kaya",
    email: "ayse.k@veritakip.com",
    phone: "+90 555 444 5566",
    department: "Human Resources",
    position: "HR Specialist",
    branch: "Izmir",
    status: "Inactive",
    workType: "Office",
    avatar: "https://picsum.photos/seed/emp4/200/200"
  },
  {
    id: "EMP005",
    name: "Caner Aydın",
    email: "caner.a@veritakip.com",
    phone: "+90 555 777 8899",
    department: "Operations",
    position: "Site Supervisor",
    branch: "Bursa",
    status: "Active",
    workType: "Field",
    avatar: "https://picsum.photos/seed/emp5/200/200"
  }
]

export default function PersonnelPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Personnel Management</h2>
          <p className="text-muted-foreground">Manage organization structure, employee profiles and roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10">
            <QrCode className="mr-2 h-4 w-4" />
            Generate IDs
          </Button>
          <Button className="h-10 bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, ID or department..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Badge variant="secondary" className="h-9 px-3 rounded-md text-xs">
                Total: 142 Personnel
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-secondary/30">
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Dept / Position</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Work Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id} className="group transition-colors">
                  <TableCell>
                    <Avatar className="border-2 border-white shadow-sm h-10 w-10">
                      <AvatarImage src={emp.avatar} alt={emp.name} />
                      <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm">
                        <Building className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        {emp.department}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Briefcase className="mr-1.5 h-3 w-3" />
                        {emp.position}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{emp.branch}</TableCell>
                  <TableCell>
                    <Badge variant={emp.workType === 'Office' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                      {emp.workType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={emp.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200'}
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Generate QR ID</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-accent">Deactivate Account</DropdownMenuItem>
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