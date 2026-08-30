import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Play, Pause, Loader2, Upload } from 'lucide-react'
import { generateListeningTest } from '@/lib/gemini'

const INITIAL_DATA = [
  {
    title: "Part 1: Accommodation Request Form",
    script: [],
    questions: [
      { num: 1, q: "Name: Anu ___", answer: "Bhatt" },
      { num: 2, q: "Student Number: ___", answer: "3902" },
      { num: 3, q: "Course Date: ___", answer: "12th May" },
      { num: 4, q: "Room Preference: Single with a ___", answer: "bathroom" },
      { num: 5, q: "Dietary Req: ___", answer: "vegetarian" }
    ]
  }
]

export default function Listening() {
  const [audioUrl, setAudioUrl] = useState<string>('/audio.mp3')
  const [audioName, setAudioName] = useState<string>('Audio Track 1')
  const [isCustomAudio, setIsCustomAudio] = useState(false)

  const [testParts, setTestParts] = useState<any[]>(INITIAL_DATA)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    return () => window.speechSynthesis.cancel()
  }, [])

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAudioUrl(URL.createObjectURL(file));
      setAudioName(file.name);
      setIsCustomAudio(true);
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setAnswers({})
    setIsSubmitted(false)
    setIsCustomAudio(false)
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    try {
      // Chunking: Fetch 4 parts concurrently
      const parts = await Promise.all([
        generateListeningTest(1),
        generateListeningTest(2),
        generateListeningTest(3),
        generateListeningTest(4)
      ]);
      
      const validParts = parts.filter(p => p && p.title && p.questions && p.questions.length > 0);
      
      if (validParts.length === 4) {
        setTestParts(validParts)
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('ielts_listening_daily_v2', JSON.stringify({ date: today, data: validParts }));
      } else {
        alert("Failed to generate all 4 parts of the listening test. Please try again.");
      }
    } catch (e) {
      console.error(e)
      alert("An error occurred during generation. Please try again.");
    }
    setIsGenerating(false)
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem('ielts_listening_daily_v2');
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === today && Array.isArray(parsed.data) && parsed.data.length === 4 && parsed.data.every((p: any) => p && p.title)) {
          setTestParts(parsed.data);
          return;
        }
      } catch (e) {}
    }
    
    // Auto-generate today's test
    handleGenerate();
  }, [])

  const handlePlayScript = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }
    
    setIsPlaying(true)
    const voices = window.speechSynthesis.getVoices()
    const voice1 = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-UK')) || voices[0]
    const voice2 = voices.find(v => v.lang.includes('en-US')) || voices[1] || voices[0]
    
    // Flatten all scripts from all parts
    const fullScript = testParts.flatMap(p => p.script || []);
    const speakers = [...new Set(fullScript.map((s: any) => s.speaker))]

    let utteranceIndex = 0;
    
    const playNext = () => {
      if (utteranceIndex >= fullScript.length) {
        setIsPlaying(false)
        return
      }
      
      const line = fullScript[utteranceIndex]
      const utterance = new SpeechSynthesisUtterance(line.text)
      utterance.voice = line.speaker === speakers[0] ? voice1 : voice2
      utterance.rate = 0.9 // Slower for listening test
      
      utterance.onend = () => {
        utteranceIndex++;
        setTimeout(playNext, 400) // Pause between speakers
      }
      
      utterance.onerror = () => {
        setIsPlaying(false)
      }
      
      window.speechSynthesis.speak(utterance)
    }
    
    playNext()
  }

  const flatQuestions = testParts.flatMap(p => p.questions || []);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Listening Practice</h1>
          <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10 w-full sm:w-auto">
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? "Generating Full Test..." : "AI Generate New Test (Parts 1-4)"}
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xl font-bold mb-2">Full IELTS Listening Test</div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{isCustomAudio ? "Local File" : "AI Synthesized"}</Badge>
                  <Badge variant="secondary" className="truncate max-w-[150px] sm:max-w-[200px]" title={audioName}>
                    {isCustomAudio ? audioName : "AI Voices"}
                  </Badge>
                  
                  <input type="file" id="audio-upload" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
                  <Button variant="outline" size="sm" className="ml-2 h-6 text-xs cursor-pointer gap-1" onClick={() => document.getElementById('audio-upload')?.click()}>
                    <Upload className="w-3 h-3"/> Load Local Audio File
                  </Button>
                </div>
              </div>
            </div>
            
            {isCustomAudio ? (
              <audio 
                src={audioUrl} 
                controls 
                className="w-full mt-2" 
              />
            ) : (
              <div className="flex items-center gap-4 mt-4 p-4 bg-background rounded-lg border">
                <Button 
                  onClick={handlePlayScript} 
                  disabled={flatQuestions.length === 0}
                  className="w-16 h-16 rounded-full shrink-0"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <div className="flex-1">
                  <p className="font-semibold">{isPlaying ? "Test is playing..." : "Click play to start AI Listening Test"}</p>
                  <p className="text-sm text-muted-foreground">The AI will read the generated script (Parts 1-4 sequentially). Ensure your volume is up!</p>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50">
        <CardHeader className="border-b">
          <CardTitle>Questions 1-{flatQuestions.length}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Complete the notes below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.</p>
        </CardHeader>
        <CardContent className="pt-8 space-y-12">
          
          {testParts.map((part, partIndex) => (
            <div key={partIndex} className="max-w-2xl mx-auto space-y-6 bg-background p-8 rounded-lg border shadow-sm font-serif">
              <h3 className="text-center font-bold text-xl uppercase mb-6 tracking-widest border-b pb-4">
                Part {partIndex + 1}: {part.title || "Listening Section"}
              </h3>
              
              <div className="space-y-4 text-lg">
                {part.questions?.map((q: any, i: number) => {
                  const globalIndex = testParts.slice(0, partIndex).reduce((acc, p) => acc + (p.questions?.length || 0), 0) + i;
                  const qNum = globalIndex + 1;
                  const parts = q.q ? q.q.split('___') : ["", ""];
                  
                  return (
                    <div key={i} className="grid grid-cols-[auto_1fr] gap-4 items-end border-b border-dashed pb-2">
                      <span className="inline-flex w-8 items-end justify-center font-sans text-sm font-bold text-primary mr-1">({qNum})</span>
                      <span className="leading-loose">
                        {parts[0]}
                        <input 
                          type="text" 
                          value={answers[qNum] || ""}
                          onChange={(e) => setAnswers({...answers, [qNum]: e.target.value})}
                          className={`border-b-2 bg-transparent outline-none min-w-[120px] font-sans px-2 text-center transition-colors ${
                            isSubmitted 
                              ? (answers[qNum]?.toLowerCase().trim() === q.answer?.toLowerCase().trim() ? "border-green-500 text-green-500" : "border-destructive text-destructive")
                              : "border-foreground/30 focus:border-primary"
                          }`} 
                        />
                        {parts[1]}
                        
                        {isSubmitted && answers[qNum]?.toLowerCase().trim() !== q.answer?.toLowerCase().trim() && (
                          <span className="ml-2 text-sm font-bold text-green-500 bg-green-500/10 px-2 rounded">
                            Answer: {q.answer}
                          </span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="gap-2 w-64" onClick={() => setIsSubmitted(true)} disabled={isSubmitted}>
              <CheckCircle className="w-5 h-5" /> Submit Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
