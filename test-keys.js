import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const rawKeys = process.env.VITE_GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEY || '';
const extractedKeys = rawKeys.match(/AQ\.[A-Za-z0-9_-]+/g) || [];
const apiKeys = extractedKeys.length > 0 ? extractedKeys : rawKeys.split(',').map(k => k.trim()).filter(Boolean);

console.log(`Found ${apiKeys.length} keys to test.`);

async function testKey(key, index, modelName) {
  const ai = new GoogleGenAI({ apiKey: key });
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello",
    });
    console.log(`[SUCCESS] Key ${index + 1} with ${modelName} works!`);
    return true;
  } catch (err) {
    console.log(`[FAILED] Key ${index + 1} with ${modelName}. Error: ${err.message}`);
    return false;
  }
}

async function run() {
  for (let i = 0; i < apiKeys.length; i++) {
    await testKey(apiKeys[i], i, 'gemini-3.1-flash-lite');
  }
}

run();
