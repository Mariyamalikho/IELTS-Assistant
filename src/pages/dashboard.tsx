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
import { BookOpen, PenTool, Headphones, Mic, Flame } from "lucide-react"
import { supabase } from "@/lib/supabase"
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
  
  useEffect(() => {
    async function fetchStats() {
      // Fetch Writing
      const { data: writing } = await supabase
        .from('writing_submissions')
        .select('created_at, ai_band_estimate')
        .order('created_at', { ascending: true })
      
      if (writing) {
        setWritingScores(writing)
        const total = writing.reduce((acc, curr) => acc + Number(curr.ai_band_estimate || 0), 0)
        if (writing.length > 0) setAvgWriting(total / writing.length)
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

    fetchStats()
  }, [])

  const overallBand = ((avgWriting || 6.0) + (avgSpeaking || 6.0) + 6.5 + 7.0) / 4

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Journey</h1>
        <p className="text-muted-foreground">Here is an overview of your IELTS preparation progress powered by Gemini AI.</p>
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Estimated Overall Band</CardDescription>
            <CardTitle className="text-4xl font-extrabold text-primary flex items-end gap-2">
              {overallBand.toFixed(1)} <span className="text-sm font-medium text-muted-foreground pb-1">/ 8.0 Target</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(overallBand / 9) * 100} className="h-2 mt-4" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Study Streak</CardDescription>
            <Flame className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardTitle className="px-6 text-3xl font-bold">3 Days</CardTitle>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">You're making great progress!</p>
          </CardContent>
        </Card>

        <Card>
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
      <Card className="col-span-full">
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
            <Card key={module.name} className="hover:shadow-md transition-shadow relative overflow-hidden">
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
