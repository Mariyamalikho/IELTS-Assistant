# Component Architecture

The IELTS Assistant is built using React and Vite, structured into modular components and custom hooks to separate logic from UI presentation.

## Core Pages

- **`dashboard.tsx`**: The main entry point displaying the user's progress, streak, and recent performance across all modules. Uses Recharts for visualizing test trends.
- **`listening.tsx`**: Simulates the IELTS Listening module. Uses browser SpeechSynthesis for audio playback and manages interactive forms for question answering.
- **`reading.tsx`**: Simulates the IELTS Reading module. Displays long-form passages with side-by-side questions using `react-markdown`.
- **`writing.tsx`**: Provides an editor for Academic and General Training writing tasks. Uses Gemini for immediate Band score estimation and feedback.
- **`speaking.tsx`**: Simulates a live speaking test. Uses the `useAudioRecorder` hook to capture audio and sends it to Gemini for transcription and evaluation.
- **`vocabulary.tsx`**: Implements a spaced repetition flashcard system. Generates 10 new words daily using Gemini if none are due for review.

## Custom Hooks

To decouple state management and side effects from the UI components, we utilize custom hooks:

- **`useApiUsage.ts`**: Tracks daily usage to maintain the user's login and practice streak. Listens for the `api_usage_updated` event to stay synchronized across tabs.
- **`useAudioRecorder.ts`**: Manages `MediaRecorder` state, handling microphone permissions, recording status, and converting audio chunks into Blobs and URLs.
- **`useLocalStorage.ts`**: A wrapper around `useState` and `useEffect` to safely read, write, and synchronize data with the browser's `localStorage`.
- **`useSpeechSynthesis.ts`**: Simplifies the usage of the browser's `window.speechSynthesis` API, managing voices and preventing overlaps.
- **`useTimer.ts`**: A generic interval-based timer used across simulation, writing, and speaking modules to track test duration.

## UI Components

We leverage `shadcn/ui` and `@base-ui` to build accessible and reusable design system elements (e.g., Cards, Buttons, Inputs, Modals).

## Services

- **`lib/gemini.ts`**: Centralized service for interacting with the Google Gemini API. Handles prompt generation, JSON schema validation, and fallback logic if the user provides a custom `x-api-key`.
- **`api/gemini.ts`**: The Vercel Serverless Function proxy. Used in production to securely hold the environment API key and avoid CORS issues, while accepting overrides via headers.
