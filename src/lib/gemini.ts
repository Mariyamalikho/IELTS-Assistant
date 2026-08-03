// Helper to track daily usage in localStorage
function trackUsage() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageDate = localStorage.getItem('ielts_api_usage_date');
    let count = parseInt(localStorage.getItem('ielts_api_usage_count') || '0', 10);
    let currentStreak = parseInt(localStorage.getItem('ielts_streak') || '0', 10);
    
    if (usageDate !== today) {
      count = 0;
      
      // Streak Logic
      if (usageDate) {
        const lastDate = new Date(usageDate);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          currentStreak++; // Consecutive day
        } else {
          currentStreak = 1; // Broken streak, restart at 1 today
        }
      } else {
        currentStreak = 1; // First day ever
      }
      
      localStorage.setItem('ielts_api_usage_date', today);
      localStorage.setItem('ielts_streak', currentStreak.toString());
    }
    
    count++;
    localStorage.setItem('ielts_api_usage_count', count.toString());
    window.dispatchEvent(new Event('api_usage_updated'));
  } catch(e) {
    // Ignore localStorage errors
  }
}

// Helper to safely parse AI JSON responses
function parseAIJson(text: string | null | undefined) {
  if (!text) return {};
  try {
    const cleaned = text.replace(/\s*```json/g, '').replace(/\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    return {};
  }
}

// Generic function to call our secure Vercel backend proxy
async function callGeminiProxy(model: string, contents: any, config: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, contents, config })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export interface EssayEvaluation {
  estimatedBand: number;
  taskAchievement: { score: number; feedback: string };
  coherenceCohesion: { score: number; feedback: string };
  lexicalResource: { score: number; feedback: string };
  grammaticalRange: { score: number; feedback: string };
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
}

export interface SpeakingEvaluation {
  transcript: string;
  estimatedBand: number;
  fluencyAndCoherence: { score: number; feedback: string };
  lexicalResource: { score: number; feedback: string };
  grammaticalRange: { score: number; feedback: string };
  pronunciation: { score: number; feedback: string };
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
}

export async function evaluateEssay(prompt: string, essay: string, taskType: 'task1' | 'task2'): Promise<EssayEvaluation> {
  const systemInstruction = `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams based on the latest Cambridge IELTS standards.
Grade the following essay based strictly on the official IELTS public band descriptors. 
Be highly critical. Do not inflate scores.

The essay is a ${taskType === 'task1' ? 'Task 1 (Report/Letter)' : 'Task 2 (Essay)'}.

Output your evaluation strictly in the following JSON format. Do NOT wrap it in markdown block quotes, return raw JSON.
{
  "estimatedBand": 6.5,
  "taskAchievement": { "score": 6.5, "feedback": "..." },
  "coherenceCohesion": { "score": 6.0, "feedback": "..." },
  "lexicalResource": { "score": 7.0, "feedback": "..." },
  "grammaticalRange": { "score": 6.5, "feedback": "..." },
  "overallFeedback": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}
`;

  const userPrompt = `
IELTS Prompt:
${prompt}

Student's Essay:
${essay}
`;

  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      userPrompt,
      { systemInstruction, temperature: 0.2, responseMimeType: "application/json" }
    );
    return parseAIJson(response.text) as EssayEvaluation;
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
}

export async function evaluateSpeaking(audioBase64: string, mimeType: string): Promise<SpeakingEvaluation> {
  const systemInstruction = `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams based on the latest Cambridge IELTS standards.
Listen to the provided audio carefully.
First, provide a transcript of what the student said.
Then, grade the spoken response strictly based on the official IELTS public band descriptors for Speaking.

Output your evaluation strictly in the following JSON format. Do NOT wrap it in markdown block quotes, return raw JSON.
{
  "transcript": "...",
  "estimatedBand": 6.5,
  "fluencyAndCoherence": { "score": 6.5, "feedback": "..." },
  "lexicalResource": { "score": 7.0, "feedback": "..." },
  "grammaticalRange": { "score": 6.0, "feedback": "..." },
  "pronunciation": { "score": 6.5, "feedback": "..." },
  "overallFeedback": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}
`;

  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      [
        { inlineData: { data: audioBase64, mimeType: mimeType } },
        "Evaluate my IELTS speaking response."
      ],
      { systemInstruction, temperature: 0.2, responseMimeType: "application/json" }
    );
    return parseAIJson(response.text) as SpeakingEvaluation;
  } catch (error) {
    console.error("Gemini Speaking Evaluation Error:", error);
    throw error;
  }
}

export async function generateDailyVocabulary() {
  const prompt = `Generate 10 advanced, C1/C2 level English vocabulary words that are highly relevant and pragmatic for the IELTS test (reading, writing, speaking, and listening). 
  Focus ONLY on high-utility words frequently found in recent Cambridge IELTS exams (e.g., words for describing graphs in Writing Task 1, arguing points in Task 2, or common reading topics like science/history/society). Do NOT provide overly complicated or archaic words that are not practically used.
  Return ONLY raw JSON in this exact format:
  [{"word": "string", "meaning": "string", "example": "string"}]
  Do NOT wrap in markdown.`;
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: "application/json", temperature: 0.7 }
    );
    
    const parsed = parseAIJson(response.text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    throw new Error("Invalid output");
  } catch (error: any) {
    console.error("Gemini API Error, falling back to mock data:", error);
    return [
      { word: "Ubiquitous", meaning: "Present, appearing, or found everywhere.", example: "Mobile phones have become ubiquitous in modern society." },
      { word: "Ephemeral", meaning: "Lasting for a very short time.", example: "The beauty of a sunset is inherently ephemeral." },
      { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically.", example: "We need a pragmatic approach to solving the climate crisis." },
      { word: "Meticulous", meaning: "Showing great attention to detail; very careful and precise.", example: "The researcher was meticulous in documenting her findings." },
      { word: "Ameliorate", meaning: "Make (something bad or unsatisfactory) better.", example: "Steps have been taken to ameliorate the situation." }
    ];
  }
}

export async function generateReadingPassage(section: 1 | 2 | 3 = 1) {
  const numQuestions = section === 3 ? 14 : 13;
  const startNum = section === 1 ? 1 : section === 2 ? 14 : 27;
  
  const difficultyContext = section === 1 
    ? "a factual, descriptive text (e.g., historical event, animal behavior, or biography) matching Cambridge IELTS Reading Passage 1 difficulty."
    : section === 2 
    ? "a detailed, slightly discursive text (e.g., workplace, technology, or social issues) matching Cambridge IELTS Reading Passage 2 difficulty."
    : "a highly complex, abstract, and argumentative text (e.g., psychology, philosophy, or theoretical science) matching Cambridge IELTS Reading Passage 3 difficulty.";

  const prompt = `You are an expert Cambridge IELTS test creator.
Write an authentic 600-word academic IELTS reading passage about ${difficultyContext}
The passage should be highly formal and contain 4-5 well-structured paragraphs.
Then, create exactly ${numQuestions} authentic IELTS questions based on the passage. Use a mix of TRUE/FALSE/NOT GIVEN, multiple choice, and fill-in-the-blanks.
The questions must be numbered from ${startNum} to ${startNum + numQuestions - 1}.
Return ONLY raw JSON in this exact format, with no markdown:
{
  "title": "string",
  "passage": "string (use \\n\\n for paragraphs)",
  "questions": [{"num": number, "q": "string (use ___ for blanks if applicable)", "answer": "string"}]
}`;
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: "application/json", temperature: 0.6 }
    );
    return parseAIJson(response.text);
  } catch(e) {
    console.error(e);
    return {};
  }
}

export async function generateSpeakingPrompt(part: 'part1' | 'part2' | 'part3') {
  let prompt = "";
  if (part === 'part1') {
    prompt = `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 1 section. 
Choose ONE highly common recent IELTS topic (e.g., Work/Studies, Hometown, Weather, Hobbies, Technology).
Generate exactly 4 questions.
Return ONLY raw JSON: {"topic": "string", "questions": ["string", "string", "string", "string"]}`;
  } else if (part === 'part2') {
    prompt = `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 2 cue card (Task).
The topic should be a recent, standard IELTS topic (e.g., Describe a person, an object, an event, or a place).
Provide the main prompt and exactly 4 bullet points.
Return ONLY raw JSON: {"topic": "string", "bullets": ["string", "string", "string", "string"]}`;
  } else {
    prompt = `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 3 discussion section.
Choose a complex, abstract topic related to a typical Part 2 topic (e.g., Society, Education, Environment, Media).
Generate exactly 4 deep, analytical questions that ask the candidate to evaluate, compare, or predict.
Return ONLY raw JSON: {"topic": "string", "questions": ["string", "string", "string", "string"]}`;
  }
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: "application/json", temperature: 0.8 }
    );
    return parseAIJson(response.text);
  } catch(e) {
    console.error(e);
    return {};
  }
}

export async function generateListeningTest(part: 1 | 2 | 3 | 4 = 1) {
  const startNum = (part - 1) * 10 + 1;
  const context = part === 1 
    ? "Part 1 (a telephone conversation between two people in an everyday social context, e.g., booking a hotel or inquiring about a club)."
    : part === 2 
    ? "Part 2 (a monologue in an everyday social context, e.g., a speech about local facilities or a tour guide)."
    : part === 3 
    ? "Part 3 (a conversation between up to four people in an educational or training context, e.g., students discussing an assignment)."
    : "Part 4 (a university lecture on an academic subject).";

  const prompt = `You are an expert Cambridge IELTS test creator.
Write an authentic IELTS Listening ${context}
The dialogue MUST include natural speech features (self-correction, hesitation, spelling out names/numbers if Part 1).
It should be about 400 words long. 
Also generate exactly 10 questions based on the script. 
The questions must be numbered from ${startNum} to ${startNum + 9}.
The answers must be STRICTLY 1, 2, or 3 words/numbers and must appear exactly as spoken in the audio.
Provide the text with standard speaker labels (e.g. Speaker 1:, Speaker 2:).
Return ONLY raw JSON in this format:
{
  "title": "string",
  "script": [{"speaker": "string", "text": "string"}],
  "questions": [{"num": number, "q": "string (use ___ for the blank)", "answer": "string"}]
}`;
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: "application/json", temperature: 0.6 }
    );
    return parseAIJson(response.text);
  } catch (e) {
    console.error(e);
    return {};
  }
}

export async function generateWritingPrompt(taskType: 'task1' | 'task2') {
  const prompt = taskType === 'task1'
    ? `You are an expert Cambridge IELTS test creator. Generate an authentic IELTS Academic Writing Task 1 prompt.
The prompt must ask the candidate to summarize a bar chart, line graph, or pie chart.
Provide a realistic prompt text. 
Also provide a Chart.js configuration JSON object for the chart so it can be rendered. Keep the chart realistic (e.g., "Car sales in Europe", "Population growth").
Return ONLY raw JSON: 
{
  "prompt": "The chart below shows...", 
  "chartConfig": { "type": "bar", "data": { "labels": ["2000", "2010"], "datasets": [{"label": "Data", "data": [10, 20]}] } }
}`
    : `You are an expert Cambridge IELTS test creator. Generate an authentic IELTS Academic Writing Task 2 essay prompt.
The prompt must be on a recent, complex issue (e.g., Globalization, Technology in Education, Government funding, Crime).
It must follow a classic IELTS structure (e.g., "To what extent do you agree?", "Discuss both views and give your opinion", or "What are the causes and solutions?").
Return ONLY raw JSON: {"prompt": "string"}`;
    
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-3.1-flash-lite',
      prompt,
      { responseMimeType: "application/json", temperature: 0.8 }
    );
    return parseAIJson(response.text);
  } catch (e) {
    console.error(e);
    return {};
  }
}
