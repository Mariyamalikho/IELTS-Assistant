import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { evaluateEssay, generateWritingPrompt } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'
import { Loader2, Send, Clock, AlertCircle } from 'lucide-react'

const DEFAULT_TASK1 = {
  prompt: `The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017.\nSummarize the information by selecting and reporting the main features, and make comparisons where relevant.\nWrite at least 150 words.`,
  chartConfig: {
    type: 'line',
    data: {
      labels: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017],
      datasets: [{ label: 'Tourist Visits (Millions)', data: [1, 1.5, 1.2, 1.8, 2, 2.5, 2.6, 3], fill: false, borderColor: 'blue' }]
    },
    options: { title: { display: true, text: 'Caribbean Island Tourist Visits' } }
  }
}

const DEFAULT_TASK2 = {
  prompt: `Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer.\nWhat, in your opinion, should be the main function of a university?\nWrite at least 250 words.`
}

export default function Writing() {
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task1')
  const [essay, setEssay] = useState('')
  const [timeLeft, setTimeLeft] = useState(20 * 60) // 20 mins for Task 1 default
  const [timerActive, setTimerActive] = useState(false)
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [promptData, setPromptData] = useState<any>(DEFAULT_TASK1)
  
  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleTaskSwitch = (val: string) => {
    const type = val as 'task1' | 'task2'
    setTaskType(type)
    setEssay('')
    setFeedback(null)
    setTimerActive(false)
    setTimeLeft(type === 'task1' ? 20 * 60 : 40 * 60)
    setPromptData(type === 'task1' ? DEFAULT_TASK1 : DEFAULT_TASK2)
  }

  const handleGeneratePrompt = async () => {
    setIsGenerating(true)
    setFeedback(null)
    setEssay('')
    setTimerActive(false)
    setTimeLeft(taskType === 'task1' ? 20 * 60 : 40 * 60)
    try {
      const data = await generateWritingPrompt(taskType)
      setPromptData(data)
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }

  const wordCount = essay.trim() === '' ? 0 : essay.trim().split(/\s+/).length
  const minWords = taskType === 'task1' ? 150 : 250

  const handleSubmit = async () => {
    if (wordCount < 50) {
      alert("Please write a bit more before submitting for evaluation.")
      return
    }

    setIsEvaluating(true)
    setTimerActive(false)
    try {
      const result = await evaluateEssay(promptData.prompt, essay, taskType)
      setFeedback(result)

      const { error } = await supabase.from('writing_submissions').insert([
        {
          task_type: taskType,
          prompt: promptData.prompt,
          content: essay,
          word_count: wordCount,
          ai_band_estimate: result.estimatedBand,
          ai_feedback: result
        }
      ])
      if (error) console.error("Error saving to Supabase:", error)

    } catch (err) {
      console.error(err)
      alert("Failed to evaluate essay. Check API keys and console logs.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const chartUrl = promptData?.chartConfig 
    ? `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(promptData.chartConfig))}`
    : null;

  return (
    <div className="flex flex-col h-full gap-6 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Writing Practice</h1>
            <p className="text-muted-foreground">Train your IELTS Writing skills under timed conditions.</p>
          </div>
          <Button onClick={handleGeneratePrompt} disabled={isGenerating} variant="outline" size="sm" className="ml-4 gap-2 border-primary/50 text-primary">
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? "Generating..." : "AI Generate New Prompt"}
          </Button>
        </div>
        
        <Tabs value={taskType} onValueChange={handleTaskSwitch} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task1">Task 1 (20 mins)</TabsTrigger>
            <TabsTrigger value="task2">Task 2 (40 mins)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* Left Side: Prompt & Feedback */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 bg-card/50">
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap mb-4 font-serif text-lg leading-relaxed">{promptData?.prompt || "Generating..."}</p>
              {taskType === 'task1' && chartUrl && (
                <div className="w-full bg-white rounded-md p-4 flex justify-center mb-4 border-2 border-primary/20">
                  <img 
                    src={chartUrl} 
                    alt="Task 1 Generated Graph" 
                    className="max-w-full h-auto object-contain max-h-[300px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {feedback && (
            <Card className="bg-primary/10 border-primary/50 animate-in fade-in zoom-in duration-500">
              <CardHeader>
                <CardTitle className="text-primary flex justify-between items-center">
                  <span>Evaluation Complete</span>
                  <span className="text-4xl">Band {feedback.estimatedBand}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Task Achievement</span>
                    <span className="font-bold">{feedback.taskAchievement?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Coherence & Cohesion</span>
                    <span className="font-bold">{feedback.coherenceCohesion?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Lexical Resource</span>
                    <span className="font-bold">{feedback.lexicalResource?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Grammar</span>
                    <span className="font-bold">{feedback.grammaticalRange?.score}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Overall Feedback</h4>
                  <p className="text-sm">{feedback.overallFeedback}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Editor */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Your Essay</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xl font-mono bg-background px-3 py-1 rounded-md border">
                <Clock className="w-5 h-5 text-primary" />
                <span className={timeLeft < 300 ? "text-destructive" : ""}>{formatTime(timeLeft)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTimerActive(!timerActive)}>
                {timerActive ? "Pause" : "Start"} Timer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-4">
            <Textarea
              className="flex-1 min-h-[300px] resize-none text-base p-4 leading-loose"
              placeholder="Start typing your essay here..."
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              disabled={isEvaluating}
            />
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-sm ${wordCount < minWords ? "text-destructive" : "text-primary"}`}>
                  {wordCount} / {minWords} words
                </span>
                {wordCount < minWords && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={isEvaluating || essay.trim() === ''}
                className="gap-2"
              >
                {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isEvaluating ? "Evaluating with AI..." : "Submit for Grading"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
