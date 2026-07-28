import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function listModels() {
  try {
    const models = await ai.models.list(); // Or however we list models in the new SDK, maybe just try a simple fetch if it doesn't work.
    for await (const m of models) {
      console.log(m.name);
    }
  } catch (err) {
    console.error("List Models Error:", err);
  }
}

listModels();
