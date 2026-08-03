import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { GoogleGenAI } from "@google/genai"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'gemini-proxy',
        configureServer(server) {
          server.middlewares.use('/api/gemini', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                const rawKeys = env.VITE_GEMINI_API_KEYS || env.GEMINI_API_KEYS || '';
                const extractedKeys = rawKeys.match(/AQ\.[A-Za-z0-9_-]+/g) || [];
                const apiKeys = extractedKeys.length > 0 
                  ? extractedKeys 
                  : rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
                
                if (apiKeys.length === 0) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'No keys' }));
                  return;
                }
                
                const key = apiKeys[Math.floor(Math.random() * apiKeys.length)];
                const ai = new GoogleGenAI({ apiKey: key });
                
                const response = await ai.models.generateContent({
                  model: parsed.model,
                  contents: parsed.contents,
                  config: parsed.config
                });
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: response.text }));
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
