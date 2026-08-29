import { useState, useEffect } from "react"
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
import { BookOpen, PenTool, Headphones, Mic, Flame, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { STORAGE_KEYS } from "@/lib/constants"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Dashboard() {
  const [writingScores, setWritingScores] = useState<any[]>([])
  const [speakingScores, setSpeakingScores] = useState<any[]>([])
  const [avgWriting, setAvgWriting] = useState(0)
  const [avgSpeaking, setAvgSpeaking] = useState(0)
  const [chartData, setChartData] = useState<any[]>([])
  const [streak, setStreak] = useState(0)
  const [isResetting, setIsResetting] = useState(false)
  const [isResetConfirming, setIsResetConfirming] = useState(false)
  
  const fetchStats = async () => {
    // Fetch Writing
    const { data: writing } = await supabase
      .from('writing_submissions')
      .select('created_at, ai_band_estimate')
      .order('created_at', { ascending: true })
    
    if (writing) {
      setWritingScores(writing)
      const total = writing.reduce((acc, curr) => acc + Number(curr.ai_band_estimate || 0), 0)
      if (writing.length > 0) setAvgWriting(total / writing.length)
      else setAvgWriting(0)
    }

    // Fetch Speaking
    const { data: speaking } = await supabase
      .from('speaking_sessions')
      .select('created_at, ai_band_estimate')
      .order('created_at', { ascending: true })
    
    if (speaking) {
      setSpeakingScores(speaking)
      const total = speaking.reduce((acc, curr) => acc + Number(curr.ai_band_estimate || 0), 0)
      if (speaking.length > 0) setAvgSpeaking(total / speaking.length)
      else setAvgSpeaking(0)
    }
    
    // Combine for Chart (simplistic grouping by entry index for demo)
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
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastUsageDate = localStorage.getItem(STORAGE_KEYS.USAGE_DATE);
    let currentStreak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10);

    if (lastUsageDate && lastUsageDate !== today) {
        const lastDate = new Date(lastUsageDate);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Streak Logic Verification:
        // When the dashboard loads, we check if the user missed yesterday.
        // If more than 1 day has passed since their last activity, their streak is broken.
        if (diffDays > 1) {
           currentStreak = 0;
           localStorage.setItem(STORAGE_KEYS.STREAK, '0');
        }
    }
    
    setStreak(currentStreak);
    fetchStats();
    
    // Listen for real-time streak updates from Gemini usage
    const handleUsageUpdate = () => {
      setStreak(parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10));
    };
    window.addEventListener('api_usage_updated', handleUsageUpdate);
    return () => window.removeEventListener('api_usage_updated', handleUsageUpdate);
  }, [])

  const handleReset = async () => {
    if (!isResetConfirming) {
      setIsResetConfirming(true)
      return
    }
    
    setIsResetting(true)
    setIsResetConfirming(false)
    
    // Reset Supabase data (Requires a dummy filter to delete all)
    await supabase.from('writing_submissions').delete().neq('created_at', '1970-01-01')
    await supabase.from('speaking_sessions').delete().neq('created_at', '1970-01-01')
    
    // Reset Local Storage data
    localStorage.removeItem(STORAGE_KEYS.VOCABULARY)
    localStorage.setItem(STORAGE_KEYS.STREAK, '0')
    setStreak(0)
    
    await fetchStats()
    setIsResetting(false)
  }

  const overallBand = ((avgWriting || 6.0) + (avgSpeaking || 6.0) + 6.5 + 7.0) / 4

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Journey</h1>
          <p className="text-muted-foreground">Here is an overview of your IELTS preparation progress powered by Gemini AI.</p>
        </div>
        <div className="flex items-center gap-2">
          {isResetConfirming && (
            <Button variant="ghost" size="sm" onClick={() => setIsResetConfirming(false)} className="text-muted-foreground">
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
            {isResetting ? "Resetting..." : isResetConfirming ? "Yes, delete everything!" : "Reset Progress"}
          </Button>
        </div>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Estimated Overall Band</CardDescription>
            <CardTitle className="text-4xl font-extrabold text-primary flex items-end gap-2">
              {overallBand.toFixed(1)} <span className="text-sm font-medium text-muted-foreground pb-1">/ 8.0 Target</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(overallBand / 9) * 100} className="h-2 mt-4" title={`Estimated Band: ${overallBand.toFixed(1)}`} />
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Study Streak</CardDescription>
            <Flame className={`w-5 h-5 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardTitle className="px-6 text-3xl font-bold">{streak} Days</CardTitle>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">
              {streak > 0 ? "You're making great progress!" : "Start practicing to build your streak!"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-2">
            <CardDescription>Practice Submissions</CardDescription>
            <CardTitle className="text-2xl font-bold">{writingScores.length + speakingScores.length} Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{writingScores.length} Writing</Badge>
              <Badge variant="secondary">{speakingScores.length} Speaking</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="col-span-full border-muted shadow-sm">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>AI-estimated band scores over your recent practice attempts.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs font-medium" />
                <YAxis domain={[4, 9]} className="text-xs font-medium" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'oklch(var(--card))', borderColor: 'oklch(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'oklch(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="Writing" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Speaking" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Submit practice tests to see your progress chart here.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Breakdown */}
      <h2 className="text-2xl font-semibold tracking-tight mt-10 mb-4">Current Module Averages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: "Reading", icon: BookOpen, band: 6.5, color: "text-blue-500", real: false },
          { name: "Writing", icon: PenTool, band: avgWriting ? avgWriting.toFixed(1) : "N/A", color: "text-purple-500", real: true },
          { name: "Listening", icon: Headphones, band: 7.0, color: "text-green-500", real: false },
          { name: "Speaking", icon: Mic, band: avgSpeaking ? avgSpeaking.toFixed(1) : "N/A", color: "text-orange-500", real: true },
        ].map((module) => {
          const Icon = module.icon
          const numBand = Number(module.band) || 0
          return (
            <Card key={module.name} className="hover:shadow-md transition-shadow relative overflow-hidden border-muted shadow-sm">
              {!module.real && (
                <div className="absolute top-0 right-0 bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-bl-md font-bold">
                  MOCK
                </div>
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
                <Icon className={`w-4 h-4 ${module.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{module.band}</div>
                <Progress value={(numBand / 9) * 100} className="h-1.5 mt-3" />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
