import { GoogleGenAI } from '@google/genai';

const rawKeys = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || '';
const apiKeys = rawKeys.split(',').map((k: string) => k.trim()).filter(Boolean);

if (apiKeys.length === 0) {
  console.warn("Missing Gemini API Key(s). AI features will not work.");
}

// Function to get a fresh AI instance with a randomly selected key to distribute quota
const getAI = () => {
  const key = apiKeys.length > 0 
    ? apiKeys[Math.floor(Math.random() * apiKeys.length)] 
    : 'dummy-key';
  return new GoogleGenAI({ apiKey: key });
};

export async function evaluateEssay(prompt: string, essay: string, taskType: 'task1' | 'task2') {
  const systemInstruction = `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams.
Grade the following essay based strictly on the official IELTS public band descriptors.

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
    const response = await getAI().models.generateContent({
      model: 'gemini-flash-latest',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temp for more consistent grading
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
}

export async function evaluateSpeaking(audioBase64: string, mimeType: string) {
  const systemInstruction = `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams.
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
    const response = await getAI().models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType
          }
        },
        "Evaluate my IELTS speaking response."
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No text returned from Gemini");
  } catch (error) {
    console.error("Gemini Speaking Evaluation Error:", error);
    throw error;
  }
}

export async function generateDailyVocabulary() {
  const prompt = `Generate 10 advanced English vocabulary words suitable for IELTS Band 8+. 
  Return ONLY raw JSON in this exact format:
  [{"word": "string", "meaning": "string", "example": "string"}]`;
  
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.7 }
    });
    
    let text = response.text || "[]";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API Error, falling back to mock data:", error);
    
    // Return high-quality fallback data so the app doesn't break when hitting rate limits
    return [
      { word: "Ubiquitous", meaning: "Present, appearing, or found everywhere.", example: "Mobile phones have become ubiquitous in modern society." },
      { word: "Ephemeral", meaning: "Lasting for a very short time.", example: "The beauty of a sunset is inherently ephemeral." },
      { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically.", example: "We need a pragmatic approach to solving the climate crisis." },
      { word: "Meticulous", meaning: "Showing great attention to detail; very careful and precise.", example: "The researcher was meticulous in documenting her findings." },
      { word: "Ameliorate", meaning: "Make (something bad or unsatisfactory) better.", example: "Steps have been taken to ameliorate the situation." },
      { word: "Pervasive", meaning: "Spreading widely throughout an area or a group of people.", example: "Ageism is pervasive and entrenched in our society." },
      { word: "Ineffable", meaning: "Too great or extreme to be expressed or described in words.", example: "The ineffable natural beauty of the Grand Canyon attracts millions." },
      { word: "Paradigm", meaning: "A typical example or pattern of something; a model.", example: "There is a new paradigm for public art in this country." },
      { word: "Mitigate", meaning: "Make less severe, serious, or painful.", example: "He wanted to mitigate misery in the world." },
      { word: "Exacerbate", meaning: "Make (a problem, bad situation, or negative feeling) worse.", example: "The exorbitant cost of land in urban areas only exacerbated the problem." }
    ];
  }
}

export async function generateReadingPassage() {
  const prompt = `Write a 500-word academic IELTS reading passage about a scientific, historical, or sociological topic. 
  Then, create 5 TRUE/FALSE/NOT GIVEN questions based on the passage.
  Return ONLY raw JSON in this exact format:
  {
    "title": "string",
    "passage": "string (use \\n\\n for paragraphs)",
    "questions": [{"num": 1, "q": "string", "answer": "TRUE|FALSE|NOT GIVEN"}]
  }`;
  
  const response = await getAI().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.7 }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateSpeakingPrompt(part: 'part1' | 'part2') {
  const prompt = part === 'part1' 
    ? `Generate 3 IELTS Speaking Part 1 questions on a single random everyday topic. Return ONLY raw JSON: {"topic": "string", "questions": ["string", "string", "string"]}`
    : `Generate an IELTS Speaking Part 2 cue card. Return ONLY raw JSON: {"topic": "string", "bullets": ["string", "string", "string", "string"]}`;
  
  const response = await getAI().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.9 }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateListeningTest() {
  const prompt = `Write an IELTS Listening Part 1 script (a conversation between two people, e.g., a receptionist and a student, or a booking agent and a customer). 
  It should be about 300 words long. 
  Also generate 5 fill-in-the-blank questions based on the script (where the answer is strictly 1-2 words).
  Return ONLY raw JSON in this format:
  {
    "title": "string",
    "script": [{"speaker": "string", "text": "string"}],
    "questions": [{"num": 1, "q": "string (use ___ for the blank)", "answer": "string"}]
  }`;
  
  const response = await getAI().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.8 }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateWritingPrompt(taskType: 'task1' | 'task2') {
  const prompt = taskType === 'task1'
    ? `Generate an IELTS Academic Writing Task 1 prompt describing a bar chart or line graph. 
    Also provide a simple Chart.js configuration JSON object for that chart so it can be rendered via QuickChart.
    Return ONLY raw JSON in this format: 
    {
      "prompt": "The chart below shows...", 
      "chartConfig": { "type": "bar", "data": { "labels": ["A", "B"], "datasets": [{"label": "Data", "data": [10, 20]}] } }
    }`
    : `Generate an IELTS Academic Writing Task 2 essay prompt on a complex social, environmental, or technological issue. Return ONLY raw JSON in this format: {"prompt": "string"}`;
    
  const response = await getAI().models.generateContent({
    model: 'gemini-flash-latest',
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.8 }
  });
  return JSON.parse(response.text || "{}");
}
