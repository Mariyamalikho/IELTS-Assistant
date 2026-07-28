import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Play, Pause, Loader2, Upload } from 'lucide-react'
import { generateListeningTest } from '@/lib/gemini'

const INITIAL_DATA = {
  title: "Accommodation Request Form",
  script: [],
  questions: [
    { num: 1, q: "Name: Anu ___", answer: "Bhatt" },
    { num: 2, q: "Student Number: ___", answer: "3902" },
    { num: 3, q: "Course Date: ___", answer: "12th May" },
    { num: 4, q: "Room Preference: Single with a ___", answer: "bathroom" },
    { num: 5, q: "Dietary Req: ___", answer: "vegetarian" }
  ]
}

export default function Listening() {
  const [audioUrl, setAudioUrl] = useState<string>('/audio.mp3')
  const [audioName, setAudioName] = useState<string>('Audio Track 1')
  const [isCustomAudio, setIsCustomAudio] = useState(false)

  const [testData, setTestData] = useState<any>(INITIAL_DATA)
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
      const data = await generateListeningTest()
      if (data && data.title) {
        setTestData(data)
      }
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }

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
    
    const speakers = [...new Set(testData.script.map((s: any) => s.speaker))]

    let utteranceIndex = 0;
    
    const playNext = () => {
      if (utteranceIndex >= testData.script.length) {
        setIsPlaying(false)
        return
      }
      
      const line = testData.script[utteranceIndex]
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

  return (
    <div className="flex flex-col h-full gap-6 p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Listening Practice</h1>
          <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? "Generating..." : "AI Generate New Test"}
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-8 flex items-center justify-between">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xl font-bold mb-2">{testData.title}</div>
                <div className="flex gap-2 items-center">
                  <Badge variant="outline">{isCustomAudio ? "Local File" : "AI Synthesized"}</Badge>
                  <Badge variant="secondary" className="truncate max-w-[200px]" title={audioName}>
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
                  disabled={testData.script.length === 0}
                  className="w-16 h-16 rounded-full shrink-0"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <div className="flex-1">
                  <p className="font-semibold">{isPlaying ? "Test is playing..." : "Click play to start AI Listening Test"}</p>
                  <p className="text-sm text-muted-foreground">The AI will read the generated script using your browser's built-in voices. Ensure your volume is up!</p>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 bg-card/50">
        <CardHeader className="border-b">
          <CardTitle>Questions 1-{testData.questions.length}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.</p>
        </CardHeader>
        <CardContent className="pt-8">
          
          <div className="max-w-2xl mx-auto space-y-6 bg-background p-8 rounded-lg border shadow-sm font-serif">
            <h3 className="text-center font-bold text-xl uppercase mb-6 tracking-widest border-b pb-4">{testData.title}</h3>
            
            <div className="space-y-4 text-lg">
              {testData.questions.map((q: any) => {
                const parts = q.q.split('___');
                return (
                  <div key={q.num} className="grid grid-cols-[auto_1fr] gap-4 items-end border-b border-dashed pb-2">
                    <span className="inline-flex w-8 items-end justify-center font-sans text-sm font-bold text-primary mr-1">({q.num})</span>
                    <span className="leading-loose">
                      {parts[0]}
                      <input 
                        type="text" 
                        value={answers[q.num] || ""}
                        onChange={(e) => setAnswers({...answers, [q.num]: e.target.value})}
                        className={`border-b-2 bg-transparent outline-none min-w-[120px] font-sans px-2 text-center transition-colors ${
                          isSubmitted 
                            ? (answers[q.num]?.toLowerCase().trim() === q.answer.toLowerCase().trim() ? "border-green-500 text-green-500" : "border-destructive text-destructive")
                            : "border-foreground/30 focus:border-primary"
                        }`} 
                      />
                      {parts[1]}
                      
                      {isSubmitted && answers[q.num]?.toLowerCase().trim() !== q.answer.toLowerCase().trim() && (
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
