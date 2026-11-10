import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

const ALLOWED_MODELS = new Set([
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
]);

export default async function handler(req: any, res: any) {
  // Set standard API security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, contents, config } = req.body || {};

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing model or contents payload' });
    }

    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: 'Requested model is not supported' });
    }

    // Protect against oversized body exploitation
    const payloadStr = JSON.stringify(contents);
    if (payloadStr.length > 15000000) { // 15MB upper limit to allow spoken audio webm
      return res.status(413).json({ error: 'Payload exceeds allowed limit' });
    }

    // Check if client provided a custom API key via header
    const customKey = typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'].trim() : null;
    
    // Read keys from server environment
    const rawKeys = process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEYS || '';
    const extractedKeys = rawKeys.match(/AQ\.[A-Za-z0-9_-]+/g) || [];
    const apiKeys = extractedKeys.length > 0 
      ? extractedKeys 
      : rawKeys.split(',').map((k: string) => k.trim()).filter(Boolean);

    let key = customKey;
    if (!key) {
      if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'Assessment service is temporarily unavailable.' });
      }
      // Distribute load across available key pool
      key = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    const statusCode = error?.status || error?.statusCode || 500;
    const cleanMessage = error?.message?.includes('503') 
      ? 'The assessment model is currently experiencing high demand. Please try again shortly.'
      : 'An unexpected error occurred while processing the request.';

    res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      error: cleanMessage
    });
  }
}
