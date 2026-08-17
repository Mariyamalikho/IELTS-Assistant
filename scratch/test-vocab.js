import fs from 'fs';

function parseAIJson(text) {
  if (!text) return {};
  try {
    const cleaned = text.replace(/\s*```json/g, '').replace(/\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    return {};
  }
}

async function run() {
  const seed = Math.floor(Math.random() * 100000);
  const prompt = `Generate exactly 10 highly pragmatic, Band 7-8 level English vocabulary words that are highly relevant for the IELTS test.
  Focus ONLY on high-utility words frequently found in recent Cambridge IELTS exams (e.g., words for describing trends in Writing Task 1, arguing points in Task 2, or common reading topics). 
  Do NOT provide overly complicated, archaic, or native-only idioms that are not practically used in academic IELTS.
  Make sure to generate a completely unique set of words (Random seed: ${seed}).
  Return ONLY raw JSON in this exact format:
  [{"word": "string", "meaning": "string", "example": "string", "synonyms": "string (comma separated)", "antonyms": "string (comma separated)"}]
  Do NOT wrap in markdown.`;

  console.log("Sending prompt...");
  try {
    const response = await fetch('http://localhost:5173/api/gemini', { // or directly to Gemini if we can't hit local Vercel
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      })
    });
    const data = await response.json();
    console.log("Response:", data);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

run();
