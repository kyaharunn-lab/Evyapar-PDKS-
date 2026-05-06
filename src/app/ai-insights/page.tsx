"use client"

import * as React from "react"
import { 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  Calendar,
  ChevronRight,
  Sparkles,
  Loader2,
  Users
} from "lucide-react"
import { detectAttendanceAnomalies, AttendanceAnomalyDetectionOutput } from "@/ai/flows/attendance-anomaly-detection-flow"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, where, limit, getDocs } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export default function AIInsightsPage() {
  const db = useFirestore();
  const personnelQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "personnel"), orderBy("name", "asc"));
  }, [db]);

  const { data: employees, loading: loadingPersonnel } = useCollection(personnelQuery);
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<AttendanceAnomalyDetectionOutput | null>(null)
  const [selectedEmp, setSelectedEmp] = React.useState<any>(null)

  const runAnalysis = async () => {
    if (!selectedEmp || !db) return;
    setLoading(true)
    try {
      // Fetch some real logs for this employee to analyze
      const logsRef = collection(db, "attendance_logs");
      const q = query(logsRef, where("personnelId", "==", selectedEmp.id), limit(10));
      const querySnapshot = await getDocs(q);
      const realRecords = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.date || "",
          scheduledStartTime: "08:00",
          scheduledEndTime: "17:00",
          actualEntryTime: data.entryTime?.toDate().toLocaleTimeString().slice(0, 5) || "",
          actualExitTime: data.exitTime?.toDate().toLocaleTimeString().slice(0, 5) || "",
          isRemoteWork: data.isRemote || false,
          gpsData: data.gps || ""
        };
      });

      const output = await detectAttendanceAnomalies({
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        department: selectedEmp.departmentId || "Genel",
        attendanceRecords: realRecords
      })
      setResults(output)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <BrainCircuit className="mr-3 h-8 w-8 text-accent" />
            AI Attendance Insights
          </h2>
          <p className="text-muted-foreground">Yapay zekâ ile mesai anomalilerini ve performans kalıplarını anlık tespit edin.</p>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={loading || !selectedEmp}
          className="bg-primary hover:bg-primary/90 min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Yapay Zekâ Analizini Başlat
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Personel Seçimi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingPersonnel ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !employees || employees.length === 0 ? (
              <div className="p-12 text-center opacity-40">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs font-bold">Analiz edilecek personel bulunamadı.</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-2">
                  {employees.map((emp: any) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmp(emp)
                        setResults(null)
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-all border ${
                        selectedEmp?.id === emp.id 
                          ? 'bg-primary text-white border-primary shadow-md' 
                          : 'bg-white hover:bg-secondary border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{emp.name}</p>
                          <p className={`text-xs ${selectedEmp?.id === emp.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {emp.departmentId || "Departman Belirtilmedi"} • {emp.id}
                          </p>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${selectedEmp?.id === emp.id ? 'text-white' : 'text-muted-foreground'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          {!results && !loading && (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center bg-white border-dashed border-2">
              <div className="bg-secondary p-6 rounded-full mb-6">
                <BrainCircuit className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Analiz Bekleniyor</h3>
              <p className="text-muted-foreground max-w-sm">
                Soldaki listeden bir personel seçin ve "Yapay Zekâ Analizini Başlat" butonuna tıklayın.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="h-full p-12 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <BrainCircuit className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
              </div>
              <h3 className="mt-8 text-xl font-semibold text-primary">VeriTakip Yapay Zekâ Motoru Çalışıyor</h3>
              <p className="text-muted-foreground mt-2">Geçmiş loglar ve GPS verileri çapraz sorgulanıyor...</p>
            </Card>
          )}

          {results && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className={`border-l-4 ${results.hasAnomalies ? 'border-l-accent' : 'border-l-green-500'} shadow-sm`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Analiz Özeti</CardTitle>
                      <CardDescription>{selectedEmp?.name} için oluşturulan rapor</CardDescription>
                    </div>
                    <Badge variant={results.hasAnomalies ? "destructive" : "default"} className="px-4 py-1">
                      {results.hasAnomalies ? 'Anomali Tespit Edildi' : 'Sorun Bulunmadı'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {!results.hasAnomalies ? (
                    <div className="bg-green-50 p-6 rounded-lg flex items-center gap-4 text-green-800">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Sparkles className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Mükemmel İstikrar</p>
                        <p className="text-sm">İncelenen dönemde mesai kayıtları vardiya planı ile tam uyumlu.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {results.anomalies.map((anomaly, idx) => (
                        <div key={idx} className="bg-white rounded-xl border p-6 space-y-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                anomaly.severity === 'High' ? 'bg-red-100' : 
                                anomaly.severity === 'Medium' ? 'bg-orange-100' : 'bg-blue-100'
                              }`}>
                                <AlertTriangle className={`h-5 w-5 ${
                                  anomaly.severity === 'High' ? 'text-accent' : 
                                  anomaly.severity === 'Medium' ? 'text-orange-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <h4 className="font-bold text-lg text-primary">{anomaly.type}</h4>
                            </div>
                            <Badge className={
                              anomaly.severity === 'High' ? 'bg-accent' : 
                              anomaly.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }>
                              {anomaly.severity} Öncelik
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-foreground/80 leading-relaxed">{anomaly.description}</p>

                          <div className="flex flex-wrap gap-2">
                            {anomaly.dates.map(date => (
                              <div key={date} className="flex items-center text-[10px] font-mono bg-secondary px-2 py-1 rounded">
                                <Calendar className="mr-1 h-3 w-3" />
                                {date}
                              </div>
                            ))}
                          </div>

                          <Separator />

                          <div className="bg-secondary/40 p-4 rounded-lg border border-secondary">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">Yapay Zekâ Önerisi</span>
                            </div>
                            <p className="text-sm italic text-primary/80">"{anomaly.insight}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
