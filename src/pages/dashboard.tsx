import { useState, useEffect, memo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, PenTool, Headphones, Mic, Flame, RotateCcw, LineChart as LineChartIcon, Award, FileCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { STORAGE_KEYS } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiUsage } from "@/hooks/useApiUsage"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

const PerformanceChart = memo(({ chartData }: { chartData: any[] }) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
          <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <YAxis domain={[4, 9]} className="text-xs" tick={{ fill: 'currentColor', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'oklch(var(--card))', 
              borderColor: 'oklch(var(--border))', 
              borderRadius: '8px',
              color: 'oklch(var(--card-foreground))'
            }}
          />
          <Line type="monotone" dataKey="Writing" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={true} />
          <Line type="monotone" dataKey="Speaking" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
PerformanceChart.displayName = 'PerformanceChart'

export default function Dashboard() {
  const [writingScores, setWritingScores] = useState<any[]>([])
  const [speakingScores, setSpeakingScores] = useState<any[]>([])
  const [avgWriting, setAvgWriting] = useState<number | null>(null)
  const [avgSpeaking, setAvgSpeaking] = useState<number | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [isResetting, setIsResetting] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { streak } = useApiUsage()

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Fetch Writing submissions
      const { data: writing } = await supabase
        .from('writing_submissions')
        .select('created_at, ai_band_estimate')
        .order('created_at', { ascending: true })
      
      if (writing && writing.length > 0) {
        setWritingScores(writing)
        const total = writing.reduce((acc, curr) => acc + Number(curr.ai_band_estimate || 0), 0)
        setAvgWriting(total / writing.length)
      } else {
        setWritingScores([])
        setAvgWriting(null)
      }

      // Fetch Speaking sessions
      const { data: speaking } = await supabase
        .from('speaking_sessions')
        .select('created_at, ai_band_estimate')
        .order('created_at', { ascending: true })
      
      if (speaking && speaking.length > 0) {
        setSpeakingScores(speaking)
        const total = speaking.reduce((acc, curr) => acc + Number(curr.ai_band_estimate || 0), 0)
        setAvgSpeaking(total / speaking.length)
      } else {
        setSpeakingScores([])
        setAvgSpeaking(null)
      }
      
      // Combine for Chart
      const combined = []
      const maxLength = Math.max(writing?.length || 0, speaking?.length || 0)
      for (let i = 0; i < maxLength; i++) {
        combined.push({
          name: `Attempt ${i + 1}`,
          Writing: writing && writing[i] ? Number(writing[i].ai_band_estimate) : null,
          Speaking: speaking && speaking[i] ? Number(speaking[i].ai_band_estimate) : null,
        })
      }
      setChartData(combined)
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleReset = async () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true)
      return
    }
    
    setIsResetting(true)
    setIsResetConfirming(false)
    
    try {
      await supabase.from('writing_submissions').delete().neq('created_at', '1970-01-01')
      await supabase.from('speaking_sessions').delete().neq('created_at', '1970-01-01')
      
      localStorage.removeItem(STORAGE_KEYS.VOCABULARY)
      localStorage.setItem(STORAGE_KEYS.STREAK, '0')
      window.dispatchEvent(new Event('api_usage_updated'))
      
      await fetchStats()
    } finally {
      setIsResetting(false)
    }
  }

  // Official IELTS Band Score rounding standard:
  // - Averages ending in .25 round up to the next half band (e.g. 6.25 -> 6.5)
  // - Averages ending in .75 round up to the next whole band (e.g. 6.75 -> 7.0)
  function roundIeltsBand(score: number): number {
    const fraction = score - Math.floor(score)
    if (fraction < 0.25) {
      return Math.floor(score)
    } else if (fraction < 0.75) {
      return Math.floor(score) + 0.5
    } else {
      return Math.ceil(score)
    }
  }

  // Calculate actual overall band based solely on recorded modules
  const recordedAverages = [avgWriting, avgSpeaking].filter((s): s is number => s !== null && s > 0)
  const rawAverage = recordedAverages.length > 0
    ? recordedAverages.reduce((a, b) => a + b, 0) / recordedAverages.length
    : null
  const roundedOverall = rawAverage !== null ? roundIeltsBand(rawAverage) : null

  return (
    <main className="space-y-6 sm:space-y-8" aria-live="polite">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Performance Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Review your verified evaluation metrics and practice consistency across all modules.</p>
        </div>
        <div className="flex items-center gap-2">
          {isResetConfirming && (
            <Button variant="ghost" size="sm" onClick={() => setIsResetConfirming(false)} className="text-muted-foreground" autoFocus>
              Cancel
            </Button>
          )}
          <Button 
            variant={isResetConfirming ? "destructive" : "outline"} 
            size="sm" 
            onClick={handleReset} 
            disabled={isResetting} 
            className={!isResetConfirming ? "text-destructive hover:bg-destructive/10" : ""}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Resetting..." : isResetConfirming ? "Confirm Delete" : "Reset History"}
          </Button>
        </div>
      </header>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Band Score Card */}
        <Card className="border shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Band Score
            </CardDescription>
            <Award className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between gap-2">
              {isLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : roundedOverall !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    Band {roundedOverall.toFixed(1)}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    ({rawAverage?.toFixed(2)} raw)
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold tracking-tight text-muted-foreground/60">—</span>
              )}
              <span className="text-xs font-medium text-muted-foreground">Target: 8.0</span>
            </div>

            <Progress 
              value={roundedOverall ? (roundedOverall / 9) * 100 : 0} 
              className="h-1.5" 
              title={roundedOverall ? `Calculated Band: ${roundedOverall.toFixed(1)}` : "No score recorded yet"}
            />

            <p className="text-xs text-muted-foreground min-h-[16px]">
              {isLoading ? (
                <Skeleton className="h-3 w-36" />
              ) : roundedOverall !== null ? (
                `Based on ${recordedAverages.length} completed ${recordedAverages.length === 1 ? 'module' : 'modules'}`
              ) : (
                "Complete Writing or Speaking to calculate"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Active Study Streak Card */}
        <Card className="border shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Study Streak
            </CardDescription>
            <Flame className={`w-4 h-4 ${streak > 0 ? "text-primary" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-9 w-24" /> : `${streak} ${streak === 1 ? 'Day' : 'Days'}`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Daily Practice</span>
            </div>

            <Progress 
              value={Math.min(100, (streak / 7) * 100)} 
              className="h-1.5" 
              title={`7-Day Goal: ${Math.min(7, streak)}/7 days`}
            />

            <p className="text-xs text-muted-foreground min-h-[16px]">
              {isLoading ? (
                <Skeleton className="h-3 w-40" />
              ) : streak > 0 ? (
                "Consistent daily practice builds test fluency."
              ) : (
                "Start today's session to begin your streak."
              )}
            </p>
          </CardContent>
        </Card>

        {/* Recorded Submissions Card */}
        <Card className="border shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recorded Submissions
            </CardDescription>
            <FileCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-9 w-20" /> : `${writingScores.length + speakingScores.length}`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Total Tests</span>
            </div>

            <div className="flex gap-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </>
              ) : (
                <>
                  <Badge variant="outline" className="font-normal text-xs">{writingScores.length} Writing</Badge>
                  <Badge variant="outline" className="font-normal text-xs">{speakingScores.length} Speaking</Badge>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground min-h-[16px]">
              {isLoading ? (
                <Skeleton className="h-3 w-36" />
              ) : (writingScores.length + speakingScores.length) > 0 ? (
                "Verified submissions saved to your history."
              ) : (
                "No evaluations recorded in this profile yet."
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Performance Progression</CardTitle>
          <CardDescription>Band score distribution across recent writing and speaking evaluations.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-md" />
          ) : chartData.length > 0 ? (
            <PerformanceChart chartData={chartData} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/10">
              <LineChartIcon className="w-10 h-10 mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium">No submission data available.</p>
              <p className="text-xs text-muted-foreground mt-1">Submit your first essay or speaking test to populate the performance chart.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Breakdown */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Module Benchmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              name: "Reading", 
              icon: BookOpen, 
              band: null, 
              note: "Practice full tests in Reading section" 
            },
            { 
              name: "Writing", 
              icon: PenTool, 
              band: avgWriting !== null ? avgWriting.toFixed(1) : null,
              note: writingScores.length > 0 ? `${writingScores.length} submissions` : "No submissions yet"
            },
            { 
              name: "Listening", 
              icon: Headphones, 
              band: null, 
              note: "Practice full tests in Listening section" 
            },
            { 
              name: "Speaking", 
              icon: Mic, 
              band: avgSpeaking !== null ? avgSpeaking.toFixed(1) : null,
              note: speakingScores.length > 0 ? `${speakingScores.length} recordings` : "No recordings yet"
            },
          ].map((module) => {
            const Icon = module.icon
            const hasScore = module.band !== null
            const numBand = Number(module.band) || 0

            return (
              <Card key={module.name} className="border shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : hasScore ? (
                      `Band ${module.band}`
                    ) : (
                      <span className="text-sm font-normal text-muted-foreground">—</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{module.note}</p>
                  {hasScore && (
                    <Progress value={(numBand / 9) * 100} className="h-1.5 mt-3" />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}
