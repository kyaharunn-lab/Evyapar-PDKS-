"use client"

import * as React from "react"
import { ShieldCheck, Plus, Filter, Users, X, Info, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function RolesPage() {
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [roles, setRoles] = React.useState<any[]>([])
  const [selectedRole, setSelectedRole] = React.useState<any | null>(null)
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null)
  
  // Form States
  const [roleName, setRoleName] = React.useState("")
  const [roleCode, setRoleCode] = React.useState("")
  const [roleDescription, setRoleDescription] = React.useState("")

  const ROLES_STORAGE_KEY = "app_roles"

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ROLES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setRoles(parsed)
    } catch {
      // ignore corrupted local data
    }
  }, [])

  const persistRoles = React.useCallback((next: any[]) => {
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors (quota, blocked, etc.)
    }
  }, [])

  const handleCreateRole = () => {
    if (!roleName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rol adı zorunludur.",
      })
      return
    }
    if (!roleCode.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rol kodu zorunludur.",
      })
      return
    }

    const now = Date.now()
    const base = {
      roleName: roleName.trim(),
      roleCode: roleCode.trim(),
      description: roleDescription,
      level: 1,
      status: "Active",
      updatedAt: now,
    }

    setRoles((prev) => {
      const list = Array.isArray(prev) ? prev : []
      if (editingRoleId) {
        const idx = list.findIndex((r) => r?.id === editingRoleId)
        if (idx >= 0) {
          const updated = { ...list[idx], ...base }
          const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
          persistRoles(next)
          return next
        }
      }
      const createdAt = now
      const newRole = { id: `role-${createdAt}-${Math.random().toString(16).slice(2)}`, ...base, createdAt }
      const next = [newRole, ...list]
      persistRoles(next)
      return next
    })
    
    // Reset and close
    setRoleName("");
    setRoleCode("");
    setRoleDescription("");
    setEditingRoleId(null)
    setIsAddOpen(false);

    toast({
      title: "Başarılı",
      description: editingRoleId ? "Rol güncellendi." : "Rol oluşturuldu.",
    })
  }

  const handleOpenDetail = (role: any) => {
    setSelectedRole(role)
    setIsDetailOpen(true)
  }

  const handleEdit = (role: any) => {
    setEditingRoleId(role?.id || null)
    setRoleName(role?.roleName || "")
    setRoleCode(role?.roleCode || "")
    setRoleDescription(role?.description || "")
    setIsAddOpen(true)
  }

  const handleDelete = (role: any) => {
    if (!role?.id) return
    setRoles((prev) => {
      const next = (Array.isArray(prev) ? prev : []).filter((r) => r?.id !== role.id)
      persistRoles(next)
      return next
    })
    toast({ title: "Başarılı", description: "Rol silindi." })
  }

  const handleDeactivate = (role: any) => {
    if (!role?.id) return
    setRoles((prev) => {
      const list = Array.isArray(prev) ? prev : []
      const idx = list.findIndex((r) => r?.id === role.id)
      if (idx < 0) return list
      const updated = { ...list[idx], status: "Inactive", updatedAt: Date.now() }
      const next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)]
      persistRoles(next)
      return next
    })
    toast({ title: "Başarılı", description: "Rol pasifleştirildi." })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Alan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-accent" />
            Yetki Rolleri
          </h2>
          <p className="text-muted-foreground mt-1">Sistem yetki ve erişim rollerini yönetin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" />
            Filtrele
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-10 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Rol
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Toplam Rol" value={roles.length.toString()} icon={ShieldCheck} color="text-primary" bg="bg-primary/5" />
        <KPICard title="Aktif Rol" value={roles.filter(r => r.status === "Active").length.toString()} icon={ShieldCheck} color="text-green-600" bg="bg-green-50" />
        <KPICard title="Atanan Personel" value="0" icon={Users} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Liste veya Empty State */}
      {roles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 min-h-[400px]">
          <div className="bg-secondary/50 p-6 rounded-full mb-6">
            <ShieldCheck className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">Henüz rol kaydı bulunmuyor.</h3>
          <p className="text-muted-foreground max-w-xs mb-6">Sisteme yetki rolleri ekleyerek erişim kontrolünü yapılandırabilirsiniz.</p>
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary/5"
            onClick={() => setIsAddOpen(true)}
          >
            İlk Rolü Tanımla
          </Button>
        </div>
      ) : (
        <Card className="premium-card overflow-hidden">
          <CardHeader className="pb-6 border-b bg-slate-50/30">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Rol Listesi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="enterprise-table-header">
                <TableRow>
                  <TableHead className="pl-6">Rol Adı</TableHead>
                  <TableHead>Rol Kodu</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Personel Sayısı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right pr-6">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="group hover:bg-slate-50/80 transition-all">
                    <TableCell className="pl-6 font-bold text-primary">{role.roleName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{role.roleCode}</TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{role.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">0</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-50 text-green-700 border-green-100 font-bold">Aktif</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenDetail(role)}>
                            Detay Gör
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(role)}>
                            <Edit2 className="mr-2 h-4 w-4 text-slate-400" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(role)}>
                            Pasifleştir
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-accent" onClick={() => handleDelete(role)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
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
      )}

      {/* Yeni Rol Paneli */}
      <Sheet
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) {
            setEditingRoleId(null)
            setRoleName("")
            setRoleCode("")
            setRoleDescription("")
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-[500px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">{editingRoleId ? "Rol Düzenle" : "Yeni Rol Oluştur"}</SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddOpen(false)} 
                  className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">
                Sistem üzerindeki erişim seviyelerini belirlemek için yeni bir rol tanımlayın.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8 pb-32">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <Info className="h-4 w-4" />
                    </div>
                    Rol Bilgileri
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="role-name" className="text-[11px] font-bold text-slate-500 uppercase">Rol Adı</Label>
                      <Input 
                        id="role-name" 
                        placeholder="Örn: Kıdemli İK Sorumlusu" 
                        className="rounded-xl border-slate-200 h-11 text-sm focus:ring-primary/20" 
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role-code" className="text-[11px] font-bold text-slate-500 uppercase">Rol Kodu</Label>
                      <Input 
                        id="role-code" 
                        placeholder="Örn: ROLE_HR_SENIOR" 
                        className="rounded-xl border-slate-200 h-11 text-sm focus:ring-primary/20 font-mono" 
                        value={roleCode}
                        onChange={(e) => setRoleCode(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role-description" className="text-[11px] font-bold text-slate-500 uppercase">Açıklama</Label>
                      <Textarea 
                        id="role-description" 
                        placeholder="Bu rolün sistemdeki yetki kapsamını açıklayın..." 
                        className="rounded-xl border-slate-200 min-h-[120px] text-sm resize-none focus:ring-primary/20" 
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Rol oluşturulduktan sonra "Yetki Yönetimi" ekranından bu role özel sayfa ve işlem izinlerini atayabilirsiniz.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-8 border-t bg-white/80 backdrop-blur-md flex gap-3 z-20">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsAddOpen(false)}
              >
                İptal
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-bold text-white transition-all active:scale-95"
                onClick={handleCreateRole}
                disabled={!roleName || !roleCode}
              >
                {editingRoleId ? "Kaydet" : "Rolü Oluştur"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Rol Detay Paneli */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-8 pb-6 border-b bg-white relative">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-extrabold text-primary">Rol Detayı</SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="rounded-full h-8 w-8 hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-slate-500 font-medium mt-1">Seçilen rolün bilgileri.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-4">
                {selectedRole && (
                  <>
                    <InfoRow label="Rol Adı" value={selectedRole.roleName || "-"} />
                    <InfoRow label="Rol Kodu" value={selectedRole.roleCode || "-"} />
                    <InfoRow label="Açıklama" value={selectedRole.description || "-"} />
                    <InfoRow label="Seviye" value={(selectedRole.level || 1).toString()} />
                    <InfoRow label="Durum" value={selectedRole.status === "Active" ? "Aktif" : "Pasif"} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-slate-100 bg-white rounded-xl px-4 py-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold text-slate-700 text-right">{value}</span>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="premium-card group hover:scale-[1.02] transition-transform border-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl", bg)}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-primary tracking-tight">{value}</div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
