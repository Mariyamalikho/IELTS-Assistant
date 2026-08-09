# IELTS Assistant

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)


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
