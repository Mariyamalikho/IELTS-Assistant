import { PROMPTS } from './prompts';

// Helper to track daily usage in localStorage
function trackUsage() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const usageDate = localStorage.getItem('ielts_api_usage_date');
    let count = parseInt(localStorage.getItem('ielts_api_usage_count') || '0', 10);
    let currentStreak = parseInt(localStorage.getItem('ielts_streak') || '0', 10);
    
    if (usageDate !== today) {
      count = 0;
      
      // Streak Logic:
      // The streak increases if the user practices on consecutive days.
      // If the user misses a day, the streak is reset to 1 on their next practice.
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
  } catch (e: any) {
    // Ignore localStorage errors
  }
}

// Helper to safely parse AI JSON responses
function parseAIJson(text: string | null | undefined) {
  if (!text) return {};
  try {
    const cleaned = text.replace(/\s*```json/g, '').replace(/\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e: any) {
    console.error("Failed to parse JSON:", text);
    return {};
  }
}

// Generic function to call our secure Vercel backend proxy
async function callGeminiProxy(model: string, contents: any, config: any) {
  const apiKey = localStorage.getItem('ielts_gemini_api_key');
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {})
    },
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
  const systemInstruction = PROMPTS.essayEvaluation(taskType);

  const userPrompt = `
IELTS Prompt:
${prompt}

Student's Essay:
${essay}
`;

  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-1.5-flash',
      userPrompt,
      { 
        systemInstruction, 
        temperature: 0.2, 
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            estimatedBand: { type: "NUMBER" },
            taskAchievement: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            coherenceCohesion: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            lexicalResource: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            grammaticalRange: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            overallFeedback: { type: "STRING" },
            strengths: { type: "ARRAY", items: { type: "STRING" } },
            weaknesses: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["estimatedBand", "taskAchievement", "coherenceCohesion", "lexicalResource", "grammaticalRange", "overallFeedback", "strengths", "weaknesses"]
        }
      }
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
Listen to and watch the provided audio/video response carefully.
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
      'gemini-1.5-flash',
      [
        { inlineData: { data: audioBase64, mimeType: mimeType } },
        "Evaluate my IELTS speaking response."
      ],
      { 
        systemInstruction, 
        temperature: 0.2, 
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            transcript: { type: "STRING" },
            estimatedBand: { type: "NUMBER" },
            fluencyAndCoherence: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            lexicalResource: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            grammaticalRange: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            pronunciation: { type: "OBJECT", properties: { score: { type: "NUMBER" }, feedback: { type: "STRING" } } },
            overallFeedback: { type: "STRING" },
            strengths: { type: "ARRAY", items: { type: "STRING" } },
            weaknesses: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["transcript", "estimatedBand", "fluencyAndCoherence", "lexicalResource", "grammaticalRange", "pronunciation", "overallFeedback", "strengths", "weaknesses"]
        }
      }
    );
    return parseAIJson(response.text) as SpeakingEvaluation;
  } catch (error) {
    console.error("Gemini Speaking Evaluation Error:", error);
    throw error;
  }
}

export async function generateDailyVocabulary() {
  const seed = Math.floor(Math.random() * 100000);
  const prompt = `Generate exactly 10 highly pragmatic, Band 7-8 level English vocabulary words that are highly relevant for the IELTS test.
  Focus ONLY on high-utility words frequently found in recent Cambridge IELTS exams (e.g., words for describing trends in Writing Task 1, arguing points in Task 2, or common reading topics). 
  Do NOT provide overly complicated, archaic, or native-only idioms that are not practically used in academic IELTS.
  Make sure to generate a completely unique set of words (Random seed: ${seed}).
  Return ONLY raw JSON in this exact format:
  [{"word": "string", "meaning": "string", "example": "string", "synonyms": "string (comma separated)", "antonyms": "string (comma separated)"}]
  Do NOT wrap in markdown.`;
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-1.5-flash',
      prompt,
      { 
        responseMimeType: "application/json", 
        temperature: 0.7,
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              word: { type: "STRING" },
              meaning: { type: "STRING" },
              example: { type: "STRING" },
              synonyms: { type: "STRING" },
              antonyms: { type: "STRING" }
            },
            required: ["word", "meaning", "example", "synonyms", "antonyms"]
          }
        }
      }
    );
    
    const parsed = parseAIJson(response.text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    throw new Error("Invalid output");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateReadingPassage(section: 1 | 2 | 3 = 1, retries = 2): Promise<any> {
  const numQuestions = section === 3 ? 14 : 13;
  const startNum = section === 1 ? 1 : section === 2 ? 14 : 27;
  
  const difficultyContext = section === 1 
    ? "a factual, descriptive text (e.g., historical event, animal behavior, or biography) matching Cambridge IELTS Reading Passage 1 difficulty."
    : section === 2 
    ? "a detailed, slightly discursive text (e.g., workplace, technology, or social issues) matching Cambridge IELTS Reading Passage 2 difficulty."
    : "a highly complex, abstract, and argumentative text (e.g., psychology, philosophy, or theoretical science) matching Cambridge IELTS Reading Passage 3 difficulty.";

  const prompt = PROMPTS.reading(difficultyContext, startNum, numQuestions);
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-1.5-flash',
      prompt,
      { 
        responseMimeType: "application/json", 
        temperature: 0.6,
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            passage: { type: "STRING" },
            questions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  num: { type: "NUMBER" },
                  q: { type: "STRING" },
                  type: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  answer: { type: "STRING" }
                },
                required: ["num", "q", "type", "answer"]
              }
            }
          },
          required: ["title", "passage", "questions"]
        }
      }
    );
    const parsed = parseAIJson(response.text);
    if (!parsed.title || !parsed.questions) throw new Error("Invalid output format");
    return parsed;
  } catch (e: any) {
    if (retries > 0) {
      console.warn(`Retrying reading passage generation (Section ${section})... (${retries} left)`); const delay = 15000; console.warn(`Waiting ${delay}ms...`); await new Promise(r => setTimeout(r, delay));
      return generateReadingPassage(section, retries - 1);
    }
    console.error(e);
    return {};
  }
}

export async function generateSpeakingPrompt(part: 'part1' | 'part2' | 'part3', retries = 2): Promise<any> {
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
      'gemini-1.5-flash',
      prompt,
      { responseMimeType: "application/json", temperature: 0.8 }
    );
    return parseAIJson(response.text);
  } catch (e: any) {
    if (retries > 0) {
      const delay = 15000;
      console.warn(`Retrying speaking prompt (${retries} left). Waiting ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return generateSpeakingPrompt(part, retries - 1);
    }
    console.error(e);
    return {};
  }
}

export async function generateListeningTest(part: 1 | 2 | 3 | 4 = 1, retries = 2): Promise<any> {
  const startNum = (part - 1) * 10 + 1;
  const context = part === 1 
    ? "Part 1 (a telephone conversation between two people in an everyday social context, e.g., booking a hotel or inquiring about a club)."
    : part === 2 
    ? "Part 2 (a monologue in an everyday social context, e.g., a speech about local facilities or a tour guide)."
    : part === 3 
    ? "Part 3 (a conversation between up to four people in an educational or training context, e.g., students discussing an assignment)."
    : "Part 4 (a university lecture on an academic subject).";

  const prompt = PROMPTS.listening(context, startNum);
  
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-1.5-flash',
      prompt,
      { 
        responseMimeType: "application/json", 
        temperature: 0.6,
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            script: {
              type: "ARRAY",
              items: { type: "OBJECT", properties: { speaker: { type: "STRING" }, text: { type: "STRING" } } }
            },
            questions: {
              type: "ARRAY",
              items: { type: "OBJECT", properties: { num: { type: "NUMBER" }, q: { type: "STRING" }, answer: { type: "STRING" } } }
            }
          },
          required: ["title", "script", "questions"]
        }
      }
    );
    const parsed = parseAIJson(response.text);
    if (!parsed.title || !parsed.questions) throw new Error("Invalid output format");
    return parsed;
  } catch (e: any) {
    if (retries > 0) {
      console.warn(`Retrying listening test generation (Part ${part})... (${retries} left)`); const delay = 15000; console.warn(`Waiting ${delay}ms...`); await new Promise(r => setTimeout(r, delay));
      return generateListeningTest(part, retries - 1);
    }
    console.error(e);
    return {};
  }
}

export async function generateWritingPrompt(taskType: 'task1' | 'task2', retries = 2): Promise<any> {
  const prompt = taskType === 'task1' ? PROMPTS.writingTask1 : PROMPTS.writingTask2;
    
  try {
    trackUsage();
    const response = await callGeminiProxy(
      'gemini-1.5-flash',
      prompt,
      { 
        responseMimeType: "application/json", 
        temperature: 0.8,
        responseSchema: {
          type: "OBJECT",
          properties: {
            prompt: { type: "STRING" },
            chartConfig: { type: "OBJECT" } // Optional, for task 1
          },
          required: ["prompt"]
        }
      }
    );
    return parseAIJson(response.text);
  } catch (e: any) {
    if (retries > 0) {
      const delay = 15000;
      console.warn(`Retrying writing prompt (${retries} left). Waiting ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return generateWritingPrompt(taskType, retries - 1);
    }
    console.error(e);
    return {};
  }
}
