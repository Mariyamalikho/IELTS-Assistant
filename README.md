# IELTS Assistant

An AI-powered IELTS preparation platform designed to simulate authentic Cambridge tests and provide spaced repetition vocabulary practice.

## Setup Instructions

To run this project locally, follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mariyamalikho/IELTS-Assistant.git
   cd IELTS-Assistant
   ```

2. **Install dependencies**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add your Gemini API key (or backend proxy URL):
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:5173` to view the application.
