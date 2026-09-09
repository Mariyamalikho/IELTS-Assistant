# Gemini API Setup Instructions

IELTS Assistant relies heavily on the Google Gemini API to generate mock tests, evaluate writing/speaking submissions, and create vocabulary lists.

## Option 1: Hosted Environment (Vercel)

If you are hosting the application yourself (e.g., on Vercel), the application will use a secure serverless function proxy located at `/api/gemini.ts`.

1. Go to [Google AI Studio](https://aistudio.google.com/) and create a free API key.
2. In your Vercel project settings, go to **Settings > Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_GEMINI_API_KEY`
   - **Value**: Your API key
4. Deploy the application. The proxy will automatically use this key.

## Option 2: Local Development

For running the app locally on your machine:

1. Copy `.env.example` to a new file named `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and add your key:
   ```env
   VITE_GEMINI_API_KEY="AIzaSyYourKeyHere..."
   ```
3. Start the dev server: `npm run dev`.

## Option 3: Client-Side Override (Settings UI)

Because the public hosted version of IELTS Assistant shares a single API key, users may occasionally hit rate limits. To solve this, users can provide their own key directly in the UI.

1. Click the **Settings** (Gear icon) in the top navigation bar.
2. Enter a valid Google Gemini API key into the "Custom Gemini API Key" field.
3. Click "Save Key".

**How it Works:** 
The application saves the key to your browser's `localStorage` (`ielts_custom_gemini_key`). Whenever the app makes a request to the `/api/gemini` proxy, it attaches this key as an `x-api-key` header. The serverless function will prioritize this header over the server's environment variable.
