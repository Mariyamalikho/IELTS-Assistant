import { useState, useEffect } from 'react'
import { generateReadingPassage } from '@/lib/gemini'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, CheckCircle, Play, Pause, Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'

export interface ReadingPassageData {
  title: string;
  passage: string;
  questions: any[];
}

const INITIAL_PASSAGES: ReadingPassageData[] = [
  {
    title: "The History of the Bicycle",
    passage: "The bicycle, an invention that revolutionized personal transport, has a rich and complex history. It did not spring fully formed from the mind of a single inventor, but rather evolved through a series of iterative improvements over the course of the 19th century.\n\nThe earliest precursor to the bicycle was the \"dandy horse\" or Laufmaschine (running machine), invented by the German Baron Karl von Drais in 1817. This early contraption had two wheels aligned in a single track and a steering mechanism, but lacked pedals. The rider propelled the machine forward by pushing off the ground with their feet, much like a modern balance bike for children.\n\nIn the 1860s, French inventors Pierre Michaux and Pierre Lallement added rotary cranks and pedals to the front wheel, creating the velocipede, colloquially known as the \"boneshaker\" due to its stiff wooden wheels and iron frame, which made for an incredibly uncomfortable ride on the cobblestone streets of the era.",
    questions: [
      { num: 1, q: "The bicycle was invented by a single person in the 19th century.", answer: "FALSE" },
      { num: 2, q: "The Laufmaschine required the rider to push off the ground with their feet.", answer: "TRUE" },
    ]
  }
]

export default function Reading() {
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [isActive, setIsActive] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [passages, setPassages] = useState<ReadingPassageData[]>(INITIAL_PASSAGES)
  const [activeTab, setActiveTab] = useState("1")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAnswers({});
    setIsSubmitted(false);
    setTimeLeft(60 * 60);
    setIsActive(false);
    setActiveTab("1");
    try {
      const parts = await Promise.all([
        generateReadingPassage(1),
        generateReadingPassage(2),
        generateReadingPassage(3)
      ]);
      
      if (parts && parts[0] && parts[0].title) {
        setPassages(parts);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(STORAGE_KEYS.READING_DAILY, JSON.stringify({ date: today, data: parts }));
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem(STORAGE_KEYS.READING_DAILY);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === today && Array.isArray(parsed.data)) {
          setPassages(parsed.data);
          return;
        }
      } catch (e) {}
    }
    
    // Auto-generate today's test
    handleGenerate();
  }, [])

  useEffect(() => {
    let interval: any = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } else if (!isActive && timeLeft !== 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const activeIndex = parseInt(activeTab) - 1;
  const currentPassage = passages[activeIndex] || passages[0];
  const totalQuestions = passages.reduce((acc, p) => acc + (p.questions?.length || 0), 0);

  return (
    <div className="flex flex-col h-full gap-6 p-4">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Reading Practice</h1>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isGenerating ? "Generating Full Test..." : "AI Generate New (Passages 1-3)"}
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">Full Academic Reading Test ({totalQuestions} Questions)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsActive(!isActive)}>
            {isActive ? <Pause className="w-4 h-4 text-destructive" /> : <Play className="w-4 h-4 text-green-500" />}
          </Button>
          <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-md border text-xl font-mono min-w-[120px]">
            <Clock className={`w-5 h-5 ${isActive ? 'text-destructive animate-pulse' : 'text-primary'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          {passages.map((_, i) => (
            <TabsTrigger key={i} value={(i + 1).toString()}>Passage {i + 1}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        {/* Left Side: Passage */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-xl">{currentPassage.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Academic Passage {activeIndex + 1}</Badge>
              <Badge variant="secondary">AI Generated</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-6 leading-loose text-lg font-serif">
            {currentPassage.passage?.split('\n\n').map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </CardContent>
        </Card>

        {/* Right Side: Questions */}
        <Card className="flex flex-col bg-card/50">
          <CardHeader className="border-b">
            <CardTitle>Questions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Answer the questions below based on Passage {activeIndex + 1}.</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-6 space-y-8">
            
            {currentPassage.questions?.map((question: any, idx: number) => {
              // Ensure we have a robust global question number
              const globalQNum = passages.slice(0, activeIndex).reduce((acc, p) => acc + (p.questions?.length || 0), 0) + idx + 1;
              const parts = question.q ? question.q.split('___') : [question.q || "", ""];
              const isFillBlank = parts.length > 1;

              return (
                <div key={idx} className="space-y-3 border-b border-dashed pb-4">
                  <p className="font-medium text-lg leading-loose">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm mr-2 font-bold">
                      {globalQNum}
                    </span>
                    {parts[0]}
                    {question.type === 'fill_blank' && (
                      <input 
                        type="text" 
                        value={answers[globalQNum] || ""}
                        onChange={(e) => setAnswers({...answers, [globalQNum]: e.target.value})}
                        className={`border-b-2 mx-2 bg-transparent outline-none min-w-[120px] font-sans px-2 text-center transition-colors ${
                          isSubmitted 
                            ? (answers[globalQNum]?.toLowerCase().trim() === question.answer?.toLowerCase().trim() ? "border-green-500 text-green-500" : "border-destructive text-destructive")
                            : "border-foreground/30 focus:border-primary"
                        }`} 
                      />
                    )}
                    {question.type === 'fill_blank' && parts[1]}
                  </p>

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="flex flex-col gap-2 pl-10">
                      {question.options.map((opt: string, i: number) => {
                        const letter = String.fromCharCode(65 + i); // A, B, C, D
                        return (
                          <Button 
                            key={letter}
                            variant={answers[globalQNum] === letter ? "default" : "outline"}
                            size="sm"
                            className={`justify-start font-normal h-auto py-2 px-4 whitespace-normal text-left ${isSubmitted && question.answer === letter ? 'bg-green-500 text-white hover:bg-green-600' : ''}`}
                            onClick={() => !isSubmitted && setAnswers({...answers, [globalQNum]: letter})}
                          >
                            <span className="font-bold mr-2">{letter}.</span> {opt}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {question.type === 'true_false' && (
                    <div className="flex gap-2 pl-10">
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                        <Button 
                          key={opt}
                          variant={answers[globalQNum] === opt ? "default" : "outline"}
                          size="sm"
                          onClick={() => !isSubmitted && setAnswers({...answers, [globalQNum]: opt})}
                          className={isSubmitted && question.answer === opt ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Fallback for old cached format */}
                  {!question.type && !isFillBlank && (
                    <div className="flex gap-2 pl-10 flex-wrap">
                      {['TRUE', 'FALSE', 'NOT GIVEN', 'A', 'B', 'C', 'D'].map(opt => (
                        <Button 
                          key={opt}
                          variant={answers[globalQNum] === opt ? "default" : "outline"}
                          size="sm" 
                          onClick={() => !isSubmitted && setAnswers({...answers, [globalQNum]: opt})}
                          className={isSubmitted && question.answer === opt ? 'bg-green-500 text-white' : ''}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}

                  {isSubmitted && answers[globalQNum]?.toLowerCase().trim() !== question.answer?.toLowerCase().trim() && (
                     <p className="pl-10 text-sm font-bold text-green-500">Correct Answer: {question.answer}</p>
                  )}
                </div>
              )
            })}

            <div className="pt-8 border-t mt-auto flex justify-between items-center">
              <div>
                {isSubmitted && <span className="font-bold text-lg text-primary">Score: {Object.keys(answers).length}/{totalQuestions}</span>}
              </div>
              <Button className="gap-2" onClick={() => setIsSubmitted(true)} disabled={isSubmitted}>
                <CheckCircle className="w-4 h-4" /> {isSubmitted ? "Submitted" : "Submit Full Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
