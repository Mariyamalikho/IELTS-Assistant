import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if client provided a custom API key
    const customKey = req.headers['x-api-key'];
    
    // Read keys from environment variables. Works in production and local dev.
    const rawKeys = process.env.VITE_GEMINI_API_KEYS || process.env.GEMINI_API_KEYS || '';
    
    // Parse keys robustly
    const extractedKeys = rawKeys.match(/AQ\.[A-Za-z0-9_-]+/g) || [];
    const apiKeys = extractedKeys.length > 0 
      ? extractedKeys 
      : rawKeys.split(',').map((k) => k.trim()).filter(Boolean);

    let key = customKey;
    if (!key) {
      if (apiKeys.length === 0) {
        return res.status(500).json({ error: 'No API keys configured on server.' });
      }
      // Pick a random key for load balancing
      key = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const { model, contents, config } = req.body;

    if (!model || !contents) {
       return res.status(400).json({ error: 'Missing model or contents payload' });
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
