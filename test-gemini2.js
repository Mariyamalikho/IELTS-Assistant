import { GoogleGenAI } from '@google/genai';

const apiKey = 'AQ.Ab8RN6JTdPr1yY3XjdW9D5X2YU28sKW5kus26jHZs9rKY4DVPQ';
const ai = new GoogleGenAI({ apiKey: apiKey });

async function testModel(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello",
    });
    console.log(`[SUCCESS] ${modelName} works! Text:`, response.text);
    return true;
  } catch (err) {
    console.log(`[FAILED] ${modelName}:`, err.message);
    return false;
  }
}

async function test() {
  const models = ['gemini-2.0-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest'];
  for (const m of models) {
    await testModel(m);
  }
}

test();
