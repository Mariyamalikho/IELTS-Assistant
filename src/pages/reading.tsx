import { useState, useEffect } from 'react'
import { generateReadingPassage } from '@/lib/gemini'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, Play, Pause, Loader2 } from 'lucide-react'
import { formatTime } from '@/lib/utils'

type Question = { num: number, q: string, answer: string }

export interface ReadingPassageData {
  title: string;
  passage: string;
  questions: Question[];
}

const INITIAL_PASSAGE: ReadingPassageData = {
  title: "The History of the Bicycle",
  passage: "The bicycle, an invention that revolutionized personal transport, has a rich and complex history. It did not spring fully formed from the mind of a single inventor, but rather evolved through a series of iterative improvements over the course of the 19th century.\n\nThe earliest precursor to the bicycle was the \"dandy horse\" or Laufmaschine (running machine), invented by the German Baron Karl von Drais in 1817. This early contraption had two wheels aligned in a single track and a steering mechanism, but lacked pedals. The rider propelled the machine forward by pushing off the ground with their feet, much like a modern balance bike for children.\n\nIn the 1860s, French inventors Pierre Michaux and Pierre Lallement added rotary cranks and pedals to the front wheel, creating the velocipede, colloquially known as the \"boneshaker\" due to its stiff wooden wheels and iron frame, which made for an incredibly uncomfortable ride on the cobblestone streets of the era.\n\nThe quest for higher speeds led to the development of the \"penny-farthing\" in the 1870s. This design featured an enormous front wheel, allowing the rider to travel farther with each pedal stroke, and a tiny rear wheel. However, the high center of gravity made the penny-farthing notoriously dangerous, leading to frequent and severe accidents.\n\nThe breakthrough came in the 1880s with the \"safety bicycle,\" pioneered by John Kemp Starley. This design returned to two wheels of equal size and introduced a chain drive to the rear wheel. Coupled with the invention of the pneumatic rubber tire by John Dunlop in 1888, the safety bicycle provided a comfortable, efficient, and safe mode of transportation, sparking a global bicycle craze in the 1890s that fundamentally altered society, particularly granting newfound mobility and freedom to women.",
  questions: [
    { num: 1, q: "The bicycle was invented by a single person in the 19th century.", answer: "FALSE" },
    { num: 2, q: "The Laufmaschine required the rider to push off the ground with their feet.", answer: "TRUE" },
    { num: 3, q: "The velocipede provided a very smooth and comfortable ride.", answer: "FALSE" },
    { num: 4, q: "The penny-farthing was designed primarily for safety.", answer: "FALSE" },
    { num: 5, q: "The safety bicycle used a chain drive connected to the front wheel.", answer: "FALSE" },
  ]
}

export default function Reading() {
  const [timeLeft, setTimeLeft] = useState(20 * 60)
  const [isActive, setIsActive] = useState(false)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [passageData, setPassageData] = useState<ReadingPassageData>(INITIAL_PASSAGE)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAnswers({});
    setIsSubmitted(false);
    setTimeLeft(20 * 60);
    setIsActive(false);
    try {
      const data = await generateReadingPassage();
      if (data && data.title) {
        setPassageData(data);
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('ielts_reading_daily', JSON.stringify({ date: today, data }));
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cachedData = localStorage.getItem('ielts_reading_daily');
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === today && parsed.data && parsed.data.title) {
          setPassageData(parsed.data);
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

  return (
    <div className="flex flex-col h-full gap-6 p-4">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Reading Practice</h1>
            <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isGenerating ? "Generating..." : "AI Generate New"}
            </Button>
          </div>
          <p className="text-muted-foreground">Academic Reading - Passage 1</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        {/* Left Side: Passage */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-xl">{passageData.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">Academic</Badge>
              <Badge variant="secondary">AI Generated</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-6 leading-loose text-lg font-serif">
            {passageData.passage.split('\n\n').map((para, i) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </CardContent>
        </Card>

        {/* Right Side: Questions */}
        <Card className="flex flex-col bg-card/50">
          <CardHeader className="border-b">
            <CardTitle>Questions 1-{passageData.questions.length}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Do the following statements agree with the information given in the Reading Passage? Write TRUE, FALSE, or NOT GIVEN.</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-6 space-y-8">
            
            {passageData.questions.map((question: Question) => (
              <div key={question.num} className="space-y-3">
                <p className="font-medium">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm mr-2">
                    {question.num}
                  </span>
                  {question.q}
                </p>
                <div className="flex gap-2 pl-8">
                  {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                    <Button 
                      key={opt}
                      variant={answers[question.num] === opt ? "default" : "outline"}
                      size="sm" 
                      onClick={() => !isSubmitted && setAnswers({...answers, [question.num]: opt})}
                      className={answers[question.num] === opt && opt === 'TRUE' ? 'bg-green-500 hover:bg-green-600' : answers[question.num] === opt && opt === 'FALSE' ? 'bg-destructive hover:bg-destructive/90' : ''}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-8 border-t mt-auto flex justify-between items-center">
              <div>
                {isSubmitted && <span className="font-bold text-lg text-primary">Score: {Object.keys(answers).length}/5 (Mock Evaluation)</span>}
              </div>
              <Button className="gap-2" onClick={() => setIsSubmitted(true)} disabled={isSubmitted}>
                <CheckCircle className="w-4 h-4" /> {isSubmitted ? "Submitted" : "Submit Answers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
