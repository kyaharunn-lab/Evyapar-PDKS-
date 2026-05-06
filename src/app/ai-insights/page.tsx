"use client"

import * as React from "react"
import { 
  BrainCircuit, 
  Search, 
  AlertTriangle, 
  Lightbulb, 
  Calendar,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Loader2
} from "lucide-react"
import { detectAttendanceAnomalies, AttendanceAnomalyDetectionOutput } from "@/ai/flows/attendance-anomaly-detection-flow"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const mockEmployees = [
  { 
    id: "EMP001", 
    name: "Ahmet Yılmaz", 
    department: "Logistics",
    records: [
      { date: "2024-03-01", scheduledStartTime: "08:00", scheduledEndTime: "17:00", actualEntryTime: "08:12", actualExitTime: "17:05" },
      { date: "2024-03-02", scheduledStartTime: "08:00", scheduledEndTime: "17:00", actualEntryTime: "08:45", actualExitTime: "17:02" },
      { date: "2024-03-03", scheduledStartTime: "08:00", scheduledEndTime: "17:00", actualEntryTime: "09:15", actualExitTime: "17:10" },
      { date: "2024-03-04", scheduledStartTime: "08:00", scheduledEndTime: "17:00", actualEntryTime: "08:50", actualExitTime: "16:55" },
      { date: "2024-03-05", scheduledStartTime: "08:00", scheduledEndTime: "17:00", actualEntryTime: "08:05", actualExitTime: "16:30" },
    ]
  },
  { 
    id: "EMP002", 
    name: "Selin Demir", 
    department: "Sales",
    records: [
      { date: "2024-03-01", scheduledStartTime: "09:00", scheduledEndTime: "18:00", actualEntryTime: "09:05", actualExitTime: "18:15", isRemoteWork: true, gpsData: "41.0082, 28.9784" },
      { date: "2024-03-02", scheduledStartTime: "09:00", scheduledEndTime: "18:00", actualEntryTime: "11:20", actualExitTime: "18:05", isRemoteWork: true, gpsData: "41.0082, 28.9784" },
      { date: "2024-03-03", scheduledStartTime: "09:00", scheduledEndTime: "18:00", actualEntryTime: "09:10", actualExitTime: "15:00", isRemoteWork: true, gpsData: "41.1234, 29.5678" },
    ]
  }
]

export default function AIInsightsPage() {
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<AttendanceAnomalyDetectionOutput | null>(null)
  const [selectedEmp, setSelectedEmp] = React.useState(mockEmployees[0])

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const output = await detectAttendanceAnomalies({
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        department: selectedEmp.department,
        attendanceRecords: selectedEmp.records
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
          <p className="text-muted-foreground">Proactive anomaly detection and intelligent pattern analysis.</p>
        </div>
        <Button 
          onClick={runAnalysis} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 min-w-[160px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Select Personnel</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-2">
                {mockEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmp(emp)
                      setResults(null)
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-all border ${
                      selectedEmp.id === emp.id 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white hover:bg-secondary border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{emp.name}</p>
                        <p className={`text-xs ${selectedEmp.id === emp.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {emp.department} • {emp.id}
                        </p>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${selectedEmp.id === emp.id ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-8 space-y-6">
          {!results && !loading && (
            <Card className="h-full flex flex-col items-center justify-center p-12 text-center bg-white border-dashed border-2">
              <div className="bg-secondary p-6 rounded-full mb-6">
                <BrainCircuit className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">Ready for Analysis</h3>
              <p className="text-muted-foreground max-w-sm">
                Select an employee from the list and click "Run AI Analysis" to identify unusual patterns or attendance discrepancies.
              </p>
            </Card>
          )}

          {loading && (
            <Card className="h-full p-12 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <BrainCircuit className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
              </div>
              <h3 className="mt-8 text-xl font-semibold text-primary">VeriTakip AI Engine Working</h3>
              <p className="text-muted-foreground mt-2">Processing historical logs and cross-referencing GPS data...</p>
            </Card>
          )}

          {results && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <Card className={`border-l-4 ${results.hasAnomalies ? 'border-l-accent' : 'border-l-green-500'} shadow-sm`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Analysis Summary</CardTitle>
                      <CardDescription>Generated for {selectedEmp.name}</CardDescription>
                    </div>
                    <Badge variant={results.hasAnomalies ? "destructive" : "default"} className="px-4 py-1">
                      {results.hasAnomalies ? 'Anomalies Detected' : 'No Major Issues'}
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
                        <p className="font-semibold">Excellent Consistency</p>
                        <p className="text-sm">Attendance records perfectly match shift schedules for the analyzed period.</p>
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
                              <h4 className="font-bold text-lg text-primary">{anomaly.type.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            </div>
                            <Badge className={
                              anomaly.severity === 'High' ? 'bg-accent' : 
                              anomaly.severity === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }>
                              {anomaly.severity} Priority
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {anomaly.description}
                          </p>

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
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Insight</span>
                            </div>
                            <p className="text-sm italic text-primary/80">
                              "{anomaly.insight}"
                            </p>
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