import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, Play, Mic, FileText, Headphones, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'
import { generateListeningTest, generateReadingPassage, generateWritingPrompt, generateSpeakingPrompt, evaluateEssay, evaluateSpeaking } from '@/lib/gemini'

type Stage = 'setup' | 'listening' | 'reading' | 'writing' | 'speaking' | 'evaluating' | 'results'

export default function Simulation() {
  const [stage, setStage] = useState<Stage>('setup')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Global Timer State
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Test Data
  const [listeningData, setListeningData] = useState<any>(null)
  const [readingData, setReadingData] = useState<any>(null)
  const [writingData, setWritingData] = useState<any>(null)
  const [speakingData, setSpeakingData] = useState<any>(null)
  
  // User Answers
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({})
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({})
  const [writingAnswer, setWritingAnswer] = useState("")
  const [speakingAudioBase64, setSpeakingAudioBase64] = useState<string | null>(null)
  const [speakingMimeType, setSpeakingMimeType] = useState<string>('audio/webm')
  
  // Evaluation Results
  const [evaluations, setEvaluations] = useState<any>(null)

  // Timer Effect
  useEffect(() => {
    if (stage === 'setup' || stage === 'evaluating' || stage === 'results') return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    
    const t = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(t)
  }, [timeLeft, stage])

  const handleTimeUp = () => {
    window.speechSynthesis.cancel();
    if (stage === 'listening') startReading();
    else if (stage === 'reading') startWriting();
    else if (stage === 'writing') startSpeaking();
    else if (stage === 'speaking') finishSimulation();
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    if (h > 0) return `${h}:${m}:${s}`
    return `${m}:${s}`
  }

  // Generate all materials for the simulation
  const startSimulation = async () => {
    setIsGenerating(true)
    try {
      const [lData, rData, wData, sData] = await Promise.all([
        generateListeningTest(),
        generateReadingPassage(),
        generateWritingPrompt('task2'), // Focus on Task 2 for simulation speed
        generateSpeakingPrompt('part2')
      ]);
      setListeningData(lData);
      setReadingData(rData);
      setWritingData(wData);
      setSpeakingData(sData);
      
      startListening();
    } catch (e) {
      console.error(e)
      alert("Failed to generate simulation materials. Check Gemini API.")
    }
    setIsGenerating(false)
  }

  // Transition Helpers
  const startListening = () => {
    setStage('listening')
    setTimeLeft(30 * 60) // 30 minutes
  }

  const startReading = () => {
    window.speechSynthesis.cancel()
    setStage('reading')
    setTimeLeft(60 * 60) // 60 minutes
  }

  const startWriting = () => {
    setStage('writing')
    setTimeLeft(60 * 60) // 60 minutes
  }

  const startSpeaking = () => {
    setStage('speaking')
    setTimeLeft(15 * 60) // 15 minutes max
  }

  const finishSimulation = async () => {
    setStage('evaluating')
    
    try {
      // 1. Evaluate Writing
      let writingFeedback = null;
      if (writingAnswer.trim().length > 50) {
        writingFeedback = await evaluateEssay(writingData.prompt, writingAnswer, 'task2');
      }

      // 2. Evaluate Speaking
      let speakingFeedback = null;
      if (speakingAudioBase64) {
        speakingFeedback = await evaluateSpeaking(speakingAudioBase64, speakingMimeType);
      }

      // 3. Simple scoring for Listening and Reading
      let listeningScore = 0;
      if (listeningData) {
        listeningData.questions.forEach((q: any) => {
          if (listeningAnswers[q.num]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
            listeningScore += 1;
          }
        });
      }

      let readingScore = 0;
      if (readingData) {
        readingData.questions.forEach((q: any) => {
          if (readingAnswers[q.num]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
            readingScore += 1;
          }
        });
      }

      setEvaluations({
        listeningRaw: listeningScore,
        listeningTotal: listeningData?.questions?.length || 0,
        readingRaw: readingScore,
        readingTotal: readingData?.questions?.length || 0,
        writing: writingFeedback,
        speaking: speakingFeedback
      })

      setStage('results')
    } catch (e) {
      console.error(e)
      alert("Evaluation failed.")
      setStage('setup')
    }
  }

  // --- Sub-components for Simulation ---

  // Speaking Recording State
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

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
        setSpeakingMimeType(blob.type || 'audio/webm')
        
        // Convert to base64 immediately for evaluation
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setSpeakingAudioBase64(reader.result.split(',')[1])
          }
        }
        reader.readAsDataURL(blob)
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      alert("Microphone access denied.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handlePlayListeningAudio = () => {
    window.speechSynthesis.cancel()
    const voices = window.speechSynthesis.getVoices()
    const voice1 = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-UK')) || voices[0]
    const voice2 = voices.find(v => v.lang.includes('en-US')) || voices[1] || voices[0]
    
    const speakers = [...new Set(listeningData.script.map((s: any) => s.speaker))]

    let utteranceIndex = 0;
    const playNext = () => {
      if (utteranceIndex >= listeningData.script.length) return;
      const line = listeningData.script[utteranceIndex]
      const utterance = new SpeechSynthesisUtterance(line.text)
      utterance.voice = line.speaker === speakers[0] ? voice1 : voice2
      utterance.rate = 0.9 
      utterance.onend = () => {
        utteranceIndex++;
        setTimeout(playNext, 400)
      }
      window.speechSynthesis.speak(utterance)
    }
    playNext()
  }

  // --- Render ---

  if (stage === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] max-w-2xl mx-auto text-center gap-8">
        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center">
          <Trophy className="w-12 h-12" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">IELTS Mock Exam Simulation</h1>
          <p className="text-xl text-muted-foreground">Experience a full 3-hour IELTS test environment.</p>
        </div>
        
        <Card className="w-full bg-card/50 text-left border-warning/50">
          <CardContent className="p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-warning">
              <AlertTriangle className="w-5 h-5" /> Strict Exam Conditions
            </h3>
            <ul className="space-y-3 text-muted-foreground list-disc list-inside">
              <li><strong>Listening (30m)</strong>: Audio plays once using AI Text-to-Speech.</li>
              <li><strong>Reading (60m)</strong>: Full 500-word academic passage.</li>
              <li><strong>Writing (60m)</strong>: Task 2 Essay. Must be 250+ words.</li>
              <li><strong>Speaking (15m)</strong>: Part 2 Long Turn recording.</li>
              <li>Timers cannot be paused. The test will auto-advance when time expires.</li>
            </ul>
          </CardContent>
        </Card>

        <Button size="lg" className="w-64 h-14 text-lg mt-4" onClick={startSimulation} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Play className="w-6 h-6 mr-2" />}
          {isGenerating ? "Generating Exam..." : "Start Simulation"}
        </Button>
      </div>
    )
  }

  if (stage === 'evaluating') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6 text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <h2 className="text-2xl font-bold">Exam Complete!</h2>
        <p className="text-muted-foreground">Gemini is evaluating your responses. This may take a minute...</p>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="flex flex-col h-full gap-6 p-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Simulation Results</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Headphones className="w-5 h-5"/> Listening</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">{evaluations.listeningRaw} / {evaluations.listeningTotal}</div>
              <p className="text-muted-foreground mt-2">Raw Score</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Reading</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">{evaluations.readingRaw} / {evaluations.readingTotal}</div>
              <p className="text-muted-foreground mt-2">Raw Score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Writing (Task 2)</CardTitle></CardHeader>
            <CardContent>
              {evaluations.writing ? (
                <>
                  <div className="text-5xl font-bold text-primary mb-4">Band {evaluations.writing.estimatedBand}</div>
                  <p className="font-semibold text-sm">TR: {evaluations.writing.taskAchievement?.score} | CC: {evaluations.writing.coherenceCohesion?.score} | LR: {evaluations.writing.lexicalResource?.score} | GRA: {evaluations.writing.grammaticalRange?.score}</p>
                </>
              ) : <p className="text-muted-foreground">No essay submitted.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5"/> Speaking</CardTitle></CardHeader>
            <CardContent>
              {evaluations.speaking ? (
                <>
                  <div className="text-5xl font-bold text-primary mb-4">Band {evaluations.speaking.estimatedBand}</div>
                  <p className="font-semibold text-sm">FC: {evaluations.speaking.fluencyAndCoherence?.score} | LR: {evaluations.speaking.lexicalResource?.score} | GRA: {evaluations.speaking.grammaticalRange?.score} | PR: {evaluations.speaking.pronunciation?.score}</p>
                </>
              ) : <p className="text-muted-foreground">No audio submitted.</p>}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center mt-8">
          <Button size="lg" onClick={() => setStage('setup')}>Return to Setup</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Persistent Exam Header */}
      <div className="bg-destructive/10 border-b border-destructive/30 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded font-bold uppercase tracking-widest text-sm">
            Mock Exam Active
          </div>
          <h2 className="font-semibold capitalize text-lg">Section: {stage}</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-2xl font-mono font-bold text-destructive">
            <Clock className="w-6 h-6 animate-pulse" />
            {formatTime(timeLeft)}
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-2"
            onClick={handleTimeUp} // Force advance
          >
            Force Advance <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
        
        {/* LISTENING SECTION */}
        {stage === 'listening' && listeningData && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{listeningData.title}</h3>
                  <p className="text-sm text-muted-foreground">Click play to begin the audio track. It will only play once.</p>
                </div>
                <Button size="lg" onClick={handlePlayListeningAudio} className="w-16 h-16 rounded-full"><Play className="w-8 h-8 ml-1"/></Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 space-y-6">
                <h3 className="font-bold uppercase tracking-widest text-center border-b pb-4 mb-8">Notes</h3>
                {listeningData.questions.map((q: any) => {
                  const parts = q.q.split('___');
                  return (
                    <div key={q.num} className="grid grid-cols-[auto_1fr] gap-4 items-end border-b border-dashed pb-4">
                      <span className="font-bold text-primary">({q.num})</span>
                      <span className="text-lg leading-loose">
                        {parts[0]}
                        <input 
                          type="text" 
                          value={listeningAnswers[q.num] || ""}
                          onChange={(e) => setListeningAnswers({...listeningAnswers, [q.num]: e.target.value})}
                          className="border-b-2 border-foreground/50 bg-transparent outline-none w-32 px-2 text-center focus:border-primary font-mono" 
                        />
                        {parts[1]}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* READING SECTION */}
        {stage === 'reading' && readingData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-w-6xl mx-auto">
            <Card className="flex flex-col h-full overflow-hidden">
              <CardHeader className="border-b bg-muted/30 pb-4">
                <CardTitle>{readingData.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 font-serif text-lg leading-loose">
                {readingData.passage.split('\n\n').map((para: string, i: number) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full bg-card/50">
              <CardHeader className="border-b">
                <CardTitle>Questions</CardTitle>
                <p className="text-sm text-muted-foreground">TRUE / FALSE / NOT GIVEN</p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
                {readingData.questions.map((q: any) => (
                  <div key={q.num} className="space-y-3">
                    <p className="font-medium text-lg"><span className="text-primary font-bold mr-2">({q.num})</span> {q.q}</p>
                    <div className="flex gap-2 pl-8">
                      {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
                        <Button 
                          key={opt}
                          variant={readingAnswers[q.num] === opt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReadingAnswers({...readingAnswers, [q.num]: opt})}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* WRITING SECTION */}
        {stage === 'writing' && writingData && (
          <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto">
            <Card className="shrink-0 bg-muted/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Writing Task 2</h3>
                <p className="text-lg leading-relaxed">{writingData.prompt}</p>
              </CardContent>
            </Card>
            
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <textarea 
                  className="flex-1 w-full p-6 bg-transparent resize-none outline-none text-lg leading-loose"
                  placeholder="Write your essay here... (minimum 250 words)"
                  value={writingAnswer}
                  onChange={(e) => setWritingAnswer(e.target.value)}
                />
                <div className="border-t p-2 px-4 flex justify-end text-sm text-muted-foreground bg-muted/10">
                  Word count: {writingAnswer.trim() ? writingAnswer.trim().split(/\s+/).length : 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SPEAKING SECTION */}
        {stage === 'speaking' && speakingData && (
          <div className="max-w-3xl mx-auto space-y-6 flex flex-col items-center justify-center h-full">
            <Card className="w-full">
              <CardHeader className="text-center border-b">
                <CardTitle className="text-2xl">Speaking Part 2: Long Turn</CardTitle>
                <p className="text-muted-foreground">You have 1 minute to prepare and 2 minutes to speak.</p>
              </CardHeader>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Describe {speakingData.topic}.</h3>
                <p className="font-medium mb-2">You should say:</p>
                <ul className="list-disc list-inside space-y-2 text-lg ml-4">
                  {speakingData.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </CardContent>
            </Card>
            
            <div className="flex flex-col items-center gap-4 mt-8">
              {!isRecording ? (
                <Button 
                  size="lg" 
                  className="w-24 h-24 rounded-full bg-primary hover:bg-primary/90 shadow-xl transition-all hover:scale-105"
                  onClick={startRecording}
                >
                  <Mic className="w-10 h-10" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="w-24 h-24 rounded-full animate-pulse shadow-xl"
                  onClick={stopRecording}
                >
                  <div className="w-8 h-8 bg-current rounded-sm" />
                </Button>
              )}
              <p className="text-muted-foreground font-medium">
                {isRecording ? "Recording... Click to stop." : "Click microphone to start recording."}
              </p>
              {speakingAudioBase64 && !isRecording && (
                <p className="text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-full mt-4">
                  Audio saved! You can force advance when ready.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
