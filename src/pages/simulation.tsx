import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, Play, Mic, FileText, Headphones, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'
import { generateListeningTest, generateReadingPassage, generateWritingPrompt, generateSpeakingPrompt, evaluateEssay, evaluateSpeaking } from '@/lib/gemini'

type Stage = 'setup' | 'listening' | 'reading' | 'writing' | 'speaking' | 'evaluating' | 'results'

export default function Simulation() {
  const [stage, setStage] = useState<Stage>('setup')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState("")
  
  // Global Timer State
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Test Data
  const [listeningData, setListeningData] = useState<any[]>([])
  const [readingData, setReadingData] = useState<any[]>([])
  const [writingData, setWritingData] = useState<any>(null) // { task1, task2 }
  const [speakingData, setSpeakingData] = useState<any>(null) // { part1, part2, part3 }
  
  // User Answers
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({})
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({})
  const [writingAnswer1, setWritingAnswer1] = useState("")
  const [writingAnswer2, setWritingAnswer2] = useState("")
  
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

  // Generate all materials sequentially in batches to avoid rate limits
  const startSimulation = async () => {
    setIsGenerating(true)
    try {
      setGenerationStatus("Generating Listening (Parts 1-4)...");
      const listening = await Promise.all([generateListeningTest(1), generateListeningTest(2), generateListeningTest(3), generateListeningTest(4)]);
      
      setGenerationStatus("Generating Reading (Passages 1-3)...");
      const reading = await Promise.all([generateReadingPassage(1), generateReadingPassage(2), generateReadingPassage(3)]);
      
      setGenerationStatus("Generating Writing (Tasks 1-2)...");
      const writing = await Promise.all([generateWritingPrompt('task1'), generateWritingPrompt('task2')]);
      
      setGenerationStatus("Generating Speaking (Parts 1-3)...");
      const speaking = await Promise.all([generateSpeakingPrompt('part1'), generateSpeakingPrompt('part2'), generateSpeakingPrompt('part3')]);

      setListeningData(listening);
      setReadingData(reading);
      setWritingData({ task1: writing[0], task2: writing[1] });
      setSpeakingData({ part1: speaking[0], part2: speaking[1], part3: speaking[2] });
      
      startListening();
    } catch (e) {
      console.error(e)
      alert("Failed to generate simulation materials. Check Gemini API rate limits.")
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
      // 1. Evaluate Writing Tasks in parallel
      let writingFeedback1: any = null;
      let writingFeedback2: any = null;
      const writingTasks = [];
      
      if (writingAnswer1.trim().length > 50) {
        writingTasks.push(evaluateEssay(writingData.task1.prompt, writingAnswer1, 'task1').then(res => writingFeedback1 = res));
      }
      if (writingAnswer2.trim().length > 50) {
        writingTasks.push(evaluateEssay(writingData.task2.prompt, writingAnswer2, 'task2').then(res => writingFeedback2 = res));
      }

      // 2. Evaluate Speaking
      let speakingFeedback = null;
      if (speakingAudioBase64) {
        writingTasks.push(evaluateSpeaking(speakingAudioBase64, speakingMimeType).then(res => speakingFeedback = res));
      }
      
      await Promise.all(writingTasks);
      
      let overallWritingBand = 0;
      if (writingFeedback1 && writingFeedback2) {
        overallWritingBand = Math.round(((writingFeedback1.estimatedBand * 1) + (writingFeedback2.estimatedBand * 2)) / 3 * 2) / 2;
      } else if (writingFeedback2) {
        overallWritingBand = writingFeedback2.estimatedBand;
      } else if (writingFeedback1) {
        overallWritingBand = writingFeedback1.estimatedBand;
      }

      // 3. Exact matching for Listening and Reading (40 questions each)
      let listeningScore = 0;
      let listeningTotal = 0;
      listeningData.forEach(part => {
        part.questions?.forEach((q: any) => {
          listeningTotal++;
          if (listeningAnswers[q.num]?.toLowerCase().trim() === q.answer?.toLowerCase().trim()) {
            listeningScore += 1;
          }
        });
      });

      let readingScore = 0;
      let readingTotal = 0;
      readingData.forEach(passage => {
        passage.questions?.forEach((q: any) => {
          readingTotal++;
          if (readingAnswers[q.num]?.toLowerCase().trim() === q.answer?.toLowerCase().trim()) {
            readingScore += 1;
          }
        });
      });

      setEvaluations({
        listeningRaw: listeningScore,
        listeningTotal: listeningTotal,
        readingRaw: readingScore,
        readingTotal: readingTotal,
        writing1: writingFeedback1,
        writing2: writingFeedback2,
        overallWritingBand: overallWritingBand,
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
  const videoRef = useRef<HTMLVideoElement>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setSpeakingMimeType(blob.type || 'video/webm')
        
        // Convert to base64 immediately for evaluation
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setSpeakingAudioBase64(reader.result.split(',')[1])
          }
        }
        reader.readAsDataURL(blob)
        
        stream.getTracks().forEach(track => track.stop())
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      alert("Microphone/Camera access denied. Please allow permissions.")
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
    
    const fullScript = listeningData.flatMap(p => p.script || []);
    const speakers = [...new Set(fullScript.map((s: any) => s.speaker))]

    let utteranceIndex = 0;
    const playNext = () => {
      if (utteranceIndex >= fullScript.length) return;
      const line = fullScript[utteranceIndex]
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
          <p className="text-xl text-muted-foreground">Experience a full 3-hour authentic IELTS test environment.</p>
        </div>
        
        <Card className="w-full bg-card/50 text-left border-warning/50">
          <CardContent className="p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-warning">
              <AlertTriangle className="w-5 h-5" /> Strict Exam Conditions
            </h3>
            <ul className="space-y-3 text-muted-foreground list-disc list-inside">
              <li><strong>Listening (30m)</strong>: 4 Parts, 40 Questions. Audio plays once.</li>
              <li><strong>Reading (60m)</strong>: 3 Passages, 40 Questions.</li>
              <li><strong>Writing (60m)</strong>: Task 1 (150 words) and Task 2 (250 words).</li>
              <li><strong>Speaking (15m)</strong>: Parts 1, 2, and 3 simulation.</li>
              <li>Timers cannot be paused. The test will auto-advance when time expires.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 mt-4">
          <Button size="lg" className="w-64 h-14 text-lg" onClick={startSimulation} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Play className="w-6 h-6 mr-2" />}
            {isGenerating ? "Building Exam..." : "Start Simulation"}
          </Button>
          {isGenerating && <p className="text-sm text-muted-foreground animate-pulse">{generationStatus}</p>}
        </div>
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
              <p className="text-muted-foreground mt-2">Raw Score (Exact match)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Reading</CardTitle></CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">{evaluations.readingRaw} / {evaluations.readingTotal}</div>
              <p className="text-muted-foreground mt-2">Raw Score (Exact match)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Writing</CardTitle></CardHeader>
            <CardContent>
              {evaluations.writing1 || evaluations.writing2 ? (
                <>
                  <div className="text-5xl font-bold text-primary mb-4">Band {evaluations.overallWritingBand}</div>
                  <div className="space-y-4">
                    {evaluations.writing1 && (
                      <div>
                        <p className="font-bold text-sm">Task 1: Band {evaluations.writing1.estimatedBand}</p>
                        <p className="text-xs text-muted-foreground">TR: {evaluations.writing1.taskAchievement?.score} | CC: {evaluations.writing1.coherenceCohesion?.score} | LR: {evaluations.writing1.lexicalResource?.score} | GRA: {evaluations.writing1.grammaticalRange?.score}</p>
                      </div>
                    )}
                    {evaluations.writing2 && (
                      <div>
                        <p className="font-bold text-sm">Task 2: Band {evaluations.writing2.estimatedBand}</p>
                        <p className="text-xs text-muted-foreground">TR: {evaluations.writing2.taskAchievement?.score} | CC: {evaluations.writing2.coherenceCohesion?.score} | LR: {evaluations.writing2.lexicalResource?.score} | GRA: {evaluations.writing2.grammaticalRange?.score}</p>
                      </div>
                    )}
                  </div>
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
        {stage === 'listening' && listeningData.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-blue-500/10 border-blue-500/30 sticky top-0 z-10 backdrop-blur-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">Full Listening Test (Parts 1-4)</h3>
                  <p className="text-sm text-muted-foreground">Click play to begin the audio track. It will play continuously.</p>
                </div>
                <Button size="lg" onClick={handlePlayListeningAudio} className="w-16 h-16 rounded-full"><Play className="w-8 h-8 ml-1"/></Button>
              </CardContent>
            </Card>

            {listeningData.map((part, pIdx) => (
              <Card key={pIdx}>
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle>Part {pIdx + 1}: {part.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {part.questions?.map((q: any) => {
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
                            className="border-b-2 border-foreground/50 bg-transparent outline-none w-48 px-2 text-center focus:border-primary font-mono" 
                          />
                          {parts[1]}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* READING SECTION */}
        {stage === 'reading' && readingData.length > 0 && (
          <div className="max-w-6xl mx-auto space-y-12 pb-12">
            {readingData.map((passage, pIdx) => (
              <div key={pIdx} className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[800px]">
                <Card className="flex flex-col h-full overflow-hidden">
                  <CardHeader className="border-b bg-muted/30 pb-4">
                    <CardTitle>Passage {pIdx + 1}: {passage.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-6 font-serif text-lg leading-loose">
                    {passage.passage?.split('\n\n').map((para: string, i: number) => (
                      <p key={i} className="mb-4">{para}</p>
                    ))}
                  </CardContent>
                </Card>

                <Card className="flex flex-col h-full bg-card/50">
                  <CardHeader className="border-b">
                    <CardTitle>Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
                    {passage.questions?.map((q: any) => {
                      const parts = q.q ? q.q.split('___') : [q.q || ""];
                      const isFillBlank = parts.length > 1;
                      return (
                          <div key={q.num} className="space-y-3 pb-4 border-b border-dashed">
                            <p className="font-medium text-lg leading-loose">
                              <span className="text-primary font-bold mr-2">({q.num})</span> 
                              {parts[0]}
                              {q.type === 'fill_blank' && (
                                <input 
                                  type="text" 
                                  value={readingAnswers[q.num] || ""}
                                  onChange={(e) => setReadingAnswers({...readingAnswers, [q.num]: e.target.value})}
                                  className="border-b-2 mx-2 border-foreground/50 bg-transparent outline-none w-32 px-2 text-center focus:border-primary font-mono" 
                                />
                              )}
                              {q.type === 'fill_blank' && parts[1]}
                            </p>
                            {q.type === 'multiple_choice' && q.options && (
                              <div className="flex flex-col gap-2 pl-8">
                                {q.options.map((opt: string, i: number) => {
                                  const letter = String.fromCharCode(65 + i); // A, B, C, D
                                  return (
                                    <Button 
                                      key={letter}
                                      variant={readingAnswers[q.num] === letter ? "default" : "outline"}
                                      size="sm"
                                      className="justify-start font-normal h-auto py-2 px-4 whitespace-normal text-left"
                                      onClick={() => setReadingAnswers({...readingAnswers, [q.num]: letter})}
                                    >
                                      <span className="font-bold mr-2">{letter}.</span> {opt}
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                            {q.type === 'true_false' && (
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
                            )}
                            {/* Fallback for old cached format */}
                            {!q.type && !isFillBlank && (
                              <div className="flex gap-2 pl-8 flex-wrap">
                                {['TRUE', 'FALSE', 'NOT GIVEN', 'A', 'B', 'C', 'D'].map(opt => (
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
                            )}
                          </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* WRITING SECTION */}
        {stage === 'writing' && writingData && (
          <div className="flex flex-col gap-12 max-w-5xl mx-auto">
            {/* Task 1 */}
            <div className="flex flex-col h-[600px] gap-6">
              <Card className="shrink-0 bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">Writing Task 1 (Spend 20 mins)</h3>
                  <p className="text-lg leading-relaxed">{writingData.task1?.prompt}</p>
                </CardContent>
              </Card>
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <textarea 
                    className="flex-1 w-full p-6 bg-transparent resize-none outline-none text-lg leading-loose"
                    placeholder="Write your Task 1 essay here... (minimum 150 words)"
                    value={writingAnswer1}
                    onChange={(e) => setWritingAnswer1(e.target.value)}
                  />
                  <div className="border-t p-2 px-4 flex justify-end text-sm text-muted-foreground bg-muted/10">
                    Word count: {writingAnswer1.trim() ? writingAnswer1.trim().split(/\s+/).length : 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task 2 */}
            <div className="flex flex-col h-[800px] gap-6">
              <Card className="shrink-0 bg-muted/30 border-primary">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2 text-primary">Writing Task 2 (Spend 40 mins)</h3>
                  <p className="text-lg leading-relaxed">{writingData.task2?.prompt}</p>
                </CardContent>
              </Card>
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <textarea 
                    className="flex-1 w-full p-6 bg-transparent resize-none outline-none text-lg leading-loose"
                    placeholder="Write your Task 2 essay here... (minimum 250 words)"
                    value={writingAnswer2}
                    onChange={(e) => setWritingAnswer2(e.target.value)}
                  />
                  <div className="border-t p-2 px-4 flex justify-end text-sm text-muted-foreground bg-muted/10">
                    Word count: {writingAnswer2.trim() ? writingAnswer2.trim().split(/\s+/).length : 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SPEAKING SECTION */}
        {stage === 'speaking' && speakingData && (
          <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-center mb-8">Speaking Test Simulation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-black text-white overflow-hidden border-0 shadow-2xl relative aspect-video flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <Headphones className="w-12 h-12 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">Examiner</p>
                  <p className="text-sm text-gray-400">Online Call</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-20" />
              </Card>

              <Card className="bg-black text-white overflow-hidden border-0 shadow-2xl relative aspect-video flex items-center justify-center">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                />
                {!isRecording && !speakingAudioBase64 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
                    <p className="font-semibold text-lg mb-4 text-center px-4">Camera feed will appear here</p>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 text-white shadow-xl transition-all hover:scale-105"
                      onClick={startRecording}
                    >
                      <Mic className="w-5 h-5 mr-2" /> Start Call (Record Video)
                    </Button>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50 backdrop-blur-sm z-20">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-red-500">REC</span>
                  </div>
                )}
                {speakingAudioBase64 && !isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 text-green-400">
                    <p className="font-bold text-xl mb-2">Interview Recorded</p>
                    <p className="text-sm text-gray-400">Waiting for evaluation...</p>
                  </div>
                )}
              </Card>
            </div>

            {isRecording && (
              <div className="flex justify-center mb-12">
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="shadow-xl"
                  onClick={stopRecording}
                >
                  <div className="w-4 h-4 bg-current rounded-sm mr-2" /> End Call
                </Button>
              </div>
            )}

            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle>Part 1: Introduction and Interview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Topic: {speakingData.part1?.topic}</h3>
                <ul className="list-disc list-inside space-y-2 text-lg">
                  {speakingData.part1?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader className="bg-primary/5 border-b border-primary/20">
                <CardTitle>Part 2: Long Turn</CardTitle>
                <p className="text-sm text-muted-foreground">You have 1 minute to prepare and 2 minutes to speak.</p>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Describe {speakingData.part2?.topic}.</h3>
                <p className="font-medium mb-2">You should say:</p>
                <ul className="list-disc list-inside space-y-2 text-lg ml-4">
                  {speakingData.part2?.bullets?.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle>Part 3: Two-Way Discussion</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Topic: {speakingData.part3?.topic}</h3>
                <ul className="list-disc list-inside space-y-2 text-lg">
                  {speakingData.part3?.questions?.map((q: string, i: number) => <li key={i}>{q}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
