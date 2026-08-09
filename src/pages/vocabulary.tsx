import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Volume2, Loader2, CheckCircle } from 'lucide-react'
import { generateDailyVocabulary } from '@/lib/gemini'

type Vocab = { 
  id: string, 
  word: string, 
  meaning: string, 
  example: string,
  synonyms?: string,
  antonyms?: string,
  interval: number,
  repetition: number,
  ease_factor: number,
  next_review_date: string,
  created_at: string
}

export default function Vocabulary() {
  const [vocabList, setVocabList] = useState<Vocab[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reviewComplete, setReviewComplete] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  useEffect(() => {
    fetchDueWords();
  }, []);

  const getLocalVocab = (): Vocab[] => {
    const raw = localStorage.getItem('ielts_vocabulary');
    return raw ? JSON.parse(raw) : [];
  }

  const saveLocalVocab = (data: Vocab[]) => {
    localStorage.setItem('ielts_vocabulary', JSON.stringify(data));
  }

  const fetchDueWords = async () => {
    setIsLoading(true);
    const now = new Date().toISOString();
    
    let allVocab = getLocalVocab();
    
    // Deduplicate words in case of previous bugs generating the same words repeatedly
    const uniqueWords = new Set();
    const deduplicatedVocab = [];
    for (const v of allVocab) {
      if (!uniqueWords.has(v.word.toLowerCase())) {
        uniqueWords.add(v.word.toLowerCase());
        deduplicatedVocab.push(v);
      }
    }
    
    if (deduplicatedVocab.length !== allVocab.length) {
      allVocab = deduplicatedVocab;
      saveLocalVocab(allVocab); // Save the cleaned up list
    }

    // Filter words due today or earlier
    const due = allVocab.filter(v => v.next_review_date <= now)
      .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));

    if (allVocab.length === 0) {
      // If we have absolutely no words in the system, generate the first batch
      await generateDaily();
    } else if (due.length === 0) {
      // If none are due, check if we already generated words today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const generatedToday = allVocab.some(v => v.created_at >= today.toISOString());
      if (!generatedToday) {
        await generateDaily();
      } else {
        setVocabList([]);
        setIsLoading(false);
      }
    } else {
      setVocabList(due);
      setIsLoading(false);
    }
  }

  const generateDaily = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const newWords = await generateDailyVocabulary();
      if (!Array.isArray(newWords)) {
        throw new Error("Gemini returned invalid format (not an array). Try again.");
      }
      
      const insertData: Vocab[] = newWords.map((w: any) => ({
        id: crypto.randomUUID(),
        word: w.word || "Unknown",
        meaning: w.meaning || "Unknown",
        example: w.example || "",
        synonyms: w.synonyms || "",
        antonyms: w.antonyms || "",
        interval: 0,
        repetition: 0,
        ease_factor: 2.5,
        next_review_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }));
      
      const allVocab = getLocalVocab();
      saveLocalVocab([...allVocab, ...insertData]);
      
      // Re-fetch after insert
      const now = new Date().toISOString();
      const refetched = getLocalVocab().filter(v => v.next_review_date <= now);
      setVocabList(refetched);
      setReviewComplete(false);
      setCurrentIndex(0);
    } catch (err: any) {
      console.error("Failed to generate words:", err);
      setGenerateError(err.message || "Unknown error occurred");
    }
    setIsGenerating(false);
    setIsLoading(false);
  }

  // SM-2 Algorithm Implementation
  const handleReview = (quality: number) => {
    // Quality: 0 = Hard (Again), 1 = Good, 2 = Easy
    const card = vocabList[currentIndex];
    let { interval, repetition, ease_factor } = card;

    if (quality === 0) {
      repetition = 0;
      interval = 1; // It will still be due tomorrow if they don't finish the session
      // But we also push it to the end of the CURRENT session so they see it again today!
      setVocabList(prev => [...prev, { ...prev[currentIndex], interval, repetition }]);
    } else if (quality === 1) {
      if (repetition === 0) {
        interval = 14; // Normal first time -> 2 weeks
      } else {
        interval = Math.round(interval * ease_factor);
      }
      repetition += 1;
    } else if (quality === 2) {
      if (repetition === 0) {
        interval = 21; // Easy first time -> 3 weeks
      } else {
        interval = Math.round(interval * ease_factor * 1.3);
      }
      repetition += 1;
    }

    // Update ease factor
    const q = quality === 0 ? 3 : (quality === 1 ? 4 : 5);
    ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    // Save to LocalStorage
    const allVocab = getLocalVocab();
    const updatedVocab = allVocab.map(v => 
      v.id === card.id 
        ? { ...v, interval, repetition, ease_factor, next_review_date: nextDate.toISOString() }
        : v
    );
    saveLocalVocab(updatedVocab);

    // Move to next card
    if (currentIndex < vocabList.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setReviewComplete(true);
    }
  }

  const playPronunciation = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  if (isLoading || isGenerating) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>{isGenerating ? "Gemini is generating your daily 10 IELTS words..." : "Loading flashcards..."}</p>
      </div>
    )
  }

  if (reviewComplete || vocabList.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-center max-w-xl mx-auto">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold">Daily Review Complete!</h2>
        <p className="text-muted-foreground">You've caught up on all your spaced repetition for today.</p>
        
        {generateError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mt-4 w-full text-sm font-medium border border-destructive/20">
            Error Generating Words: {generateError}
          </div>
        )}

        <Button onClick={generateDaily} disabled={isGenerating} variant="outline" className="mt-6 gap-2 border-primary text-primary hover:bg-primary/10">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isGenerating ? "Generating words..." : "Force Generate 10 More Words"}
        </Button>
      </div>
    )
  }

  const currentCard = vocabList[currentIndex]

  return (
    <div className="flex flex-col h-full gap-6 p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Review</h1>
          <p className="text-muted-foreground">Anki-style Spaced Repetition</p>
        </div>
        <div className="text-sm font-bold bg-primary/10 text-primary px-4 py-2 rounded-md">
          {currentIndex + 1} / {vocabList.length} Due Today
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <div 
          className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            <Card className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-xl hover:shadow-primary/20 transition-shadow">
              <CardContent className="p-12 text-center">
                <h2 className="text-5xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-4">
                  {currentCard.word}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-12 h-12 rounded-full hover:bg-primary/20" 
                    onClick={(e) => playPronunciation(e, currentCard.word)}
                  >
                    <Volume2 className="w-6 h-6 text-primary" />
                  </Button>
                </h2>
                <p className="text-muted-foreground flex items-center justify-center gap-2 mt-8">
                  <RotateCcw className="w-4 h-4" /> Click to reveal meaning
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="absolute inset-0 flex items-center justify-center bg-card border-2 border-primary/40 shadow-xl overflow-y-auto">
              <CardContent className="p-8 text-center flex flex-col gap-4 w-full h-full justify-center animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-widest mb-1">Meaning</h3>
                  <p className="text-xl font-medium">{currentCard.meaning}</p>
                </div>
                {currentCard.example && (
                  <div className="bg-muted/30 p-3 rounded-lg mx-auto w-full">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Example</h3>
                    <p className="italic font-serif text-md">"{currentCard.example}"</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {currentCard.synonyms && (
                    <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                      <h3 className="text-xs font-semibold text-green-700 uppercase mb-1">Synonyms</h3>
                      <p className="text-sm text-green-600 font-medium">{currentCard.synonyms}</p>
                    </div>
                  )}
                  {currentCard.antonyms && (
                    <div className="bg-destructive/10 p-2 rounded border border-destructive/20">
                      <h3 className="text-xs font-semibold text-destructive uppercase mb-1">Antonyms</h3>
                      <p className="text-sm text-destructive/80 font-medium">{currentCard.antonyms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons - Only show when flipped */}
        {isFlipped && (
          <div className="flex gap-4 mt-8 animate-in slide-in-from-bottom-4">
            <Button variant="destructive" size="lg" className="w-32 flex flex-col gap-1 h-auto py-2" onClick={(e) => { e.stopPropagation(); handleReview(0); }}>
              <span>Hard</span>
              <span className="text-xs opacity-80">(Again)</span>
            </Button>
            <Button variant="default" size="lg" className="w-32 bg-blue-500 hover:bg-blue-600 flex flex-col gap-1 h-auto py-2" onClick={(e) => { e.stopPropagation(); handleReview(1); }}>
              <span>Normal</span>
              <span className="text-xs opacity-80">(2 Weeks)</span>
            </Button>
            <Button variant="default" size="lg" className="w-32 bg-green-500 hover:bg-green-600 flex flex-col gap-1 h-auto py-2" onClick={(e) => { e.stopPropagation(); handleReview(2); }}>
              <span>Easy</span>
              <span className="text-xs opacity-80">(3 Weeks)</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
