import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { evaluateSpeaking, generateSpeakingPrompt } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'
import { Loader2, Mic, Square, Play } from 'lucide-react'

const PART1_PROMPT = `Part 1: Introduction and Interview (4-5 minutes)
Let's talk about your hometown.
- Where is your hometown located?
- What is it known for?
- Would you say it's a good place to live? Why?
Please record your answer (aim for 1-2 minutes).`

const PART2_PROMPT = `Part 2: Long Turn (3-4 minutes)
Describe a book that you enjoyed reading.
You should say:
- What the book is about
- When you read it
- Why you decided to read it
- And explain why you enjoyed reading it.
Please record your answer (aim for 2 minutes).`

export default function Speaking() {
  const [part, setPart] = useState<'part1' | 'part2'>('part1')
  const [promptText, setPromptText] = useState(PART1_PROMPT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleGeneratePrompt = async () => {
    setIsGenerating(true);
    try {
      const data = await generateSpeakingPrompt(part);
      let newPromptText = ""
      if (part === 'part1') {
        newPromptText = `Part 1: Introduction and Interview\nLet's talk about ${data.topic}.\n` + data.questions.map((q: string) => `- ${q}`).join('\n') + `\nPlease record your answer (aim for 1-2 minutes).`;
      } else {
        newPromptText = `Part 2: Long Turn\nDescribe ${data.topic}.\nYou should say:\n` + data.bullets.map((b: string) => `- ${b}`).join('\n') + `\nPlease record your answer (aim for 2 minutes).`;
      }
      setPromptText(newPromptText);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`ielts_speaking_daily_${part}`, JSON.stringify({ date: today, text: newPromptText }));
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem(`ielts_speaking_daily_${part}`);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === today && parsed.text) {
          setPromptText(parsed.text);
          return;
        }
      } catch (e) {}
    }
    
    // Auto-generate today's test
    handleGeneratePrompt();
  }, [part])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop()) // Stop mic access
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      setAudioUrl(null)
      setAudioBlob(null)
      setFeedback(null)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Microphone access denied or not available.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 part from data URL
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error("FileReader result is not a string"))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleSubmit = async () => {
    if (!audioBlob) return

    setIsEvaluating(true)
    try {
      const base64Audio = await blobToBase64(audioBlob)
      const mimeType = audioBlob.type || 'audio/webm'
      
      // 1. Get AI Evaluation
      const result = await evaluateSpeaking(base64Audio, mimeType)
      setFeedback(result)

      // 2. Save to Supabase (assuming table is created by user later)
      const { error } = await supabase.from('speaking_sessions').insert([
        {
          transcript: result.transcript,
          ai_band_estimate: result.estimatedBand,
          ai_feedback: result
        }
      ])
      if (error) console.error("Error saving to Supabase:", error)
      
    } catch (err) {
      console.error(err)
      alert("Failed to evaluate speaking response. Check console logs.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const handlePartSwitch = (val: string) => {
    const newPart = val as 'part1' | 'part2';
    setPart(newPart)
    setPromptText(newPart === 'part1' ? PART1_PROMPT : PART2_PROMPT)
    setFeedback(null)
    setAudioUrl(null)
    setAudioBlob(null)
    if (isRecording) stopRecording()
  }

  return (
    <div className="flex flex-col h-full gap-6 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Speaking Practice</h1>
          <p className="text-muted-foreground">Record your voice and get AI fluency evaluation.</p>
        </div>
        
        <Tabs value={part} onValueChange={handlePartSwitch} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="part1">Part 1 (Interview)</TabsTrigger>
            <TabsTrigger value="part2">Part 2 (Long Turn)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Side: Prompt & Audio Control */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Prompt</CardTitle>
              <Button onClick={handleGeneratePrompt} disabled={isGenerating} variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isGenerating ? "Generating..." : "AI Generate New"}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{promptText}</p>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center p-8 bg-card/30 border-2 border-primary/20 relative overflow-hidden">
            {isRecording && (
              <div className="absolute inset-0 bg-destructive/10 animate-pulse pointer-events-none" />
            )}
            
            <div className="text-5xl font-mono mb-8 z-10 flex flex-col items-center">
              <span className={isRecording ? "text-destructive" : ""}>
                {formatTime(recordingTime)}
              </span>
              {isRecording && <span className="text-sm text-destructive mt-2 animate-pulse">Recording...</span>}
            </div>

            <div className="flex gap-4 z-10">
              {!isRecording ? (
                <Button 
                  size="lg" 
                  aria-label="Start recording"
                  className="w-24 h-24 rounded-full bg-primary hover:bg-primary/90 flex-col gap-2 shadow-[0_0_30px_oklch(var(--primary)/0.5)] transition-all hover:scale-110 active:scale-95"
                  onClick={startRecording}
                  disabled={isEvaluating}
                >
                  <Mic className="w-10 h-10" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  aria-label="Stop recording"
                  variant="destructive"
                  className="w-24 h-24 rounded-full flex-col gap-2 animate-in zoom-in"
                  onClick={stopRecording}
                >
                  <Square className="w-10 h-10 fill-current" />
                </Button>
              )}
            </div>

            {audioUrl && !isRecording && (
              <div className="mt-8 w-full animate-in slide-in-from-bottom-4">
                <audio src={audioUrl} controls className="w-full h-12" />
                <Button 
                  className="w-full mt-4 gap-2" 
                  onClick={handleSubmit}
                  disabled={isEvaluating}
                >
                  {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isEvaluating ? "Analyzing Audio..." : "Submit for Evaluation"}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Feedback */}
        <div className="flex flex-col h-full min-h-[500px]">
          {isEvaluating ? (
             <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-primary/30 bg-primary/5">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Gemini is listening to your response...</p>
             </div>
          ) : feedback ? (
            <Card className="flex-1 bg-primary/10 border-primary/50 animate-in fade-in zoom-in duration-500 overflow-y-auto max-h-[800px]">
              <CardHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
                <CardTitle className="text-primary flex justify-between items-center">
                  <span>Evaluation Complete</span>
                  <span className="text-4xl">Band {feedback.estimatedBand}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Transcript
                  </h4>
                  <p className="text-sm p-4 bg-background rounded-md italic border-l-4 border-primary">
                    "{feedback.transcript}"
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Fluency & Coherence</span>
                    <span className="font-bold">{feedback.fluencyAndCoherence?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Lexical Resource</span>
                    <span className="font-bold">{feedback.lexicalResource?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Grammar</span>
                    <span className="font-bold">{feedback.grammaticalRange?.score}</span>
                  </div>
                  <div className="bg-background p-3 rounded-md">
                    <span className="block text-sm text-muted-foreground">Pronunciation</span>
                    <span className="font-bold">{feedback.pronunciation?.score}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-1">Overall Feedback</h4>
                  <p className="text-sm">{feedback.overallFeedback}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-green-500 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {feedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-destructive mb-2">Areas to Improve</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {feedback.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-muted bg-muted/20 text-muted-foreground">
              <Mic className="w-16 h-16 mb-4 opacity-20" />
              <p>Record and submit your answer to see feedback here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
