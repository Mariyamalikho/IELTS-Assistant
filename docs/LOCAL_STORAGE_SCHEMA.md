# Local Storage Schema

IELTS Assistant relies on `localStorage` for offline-first data persistence, API caching, and state synchronization across sessions.

## Keys & Schemas

### `ielts_streak`
- **Type**: `string` (Number)
- **Description**: Tracks the user's consecutive daily practice streak. Updated by the `useApiUsage` hook whenever an API request is successfully completed. Resets to `"0"` if more than 24 hours have passed between sessions.

### `ielts_api_usage_date`
- **Type**: `string` (ISO Date `YYYY-MM-DD`)
- **Description**: The date of the user's last recorded API interaction. Used in conjunction with `ielts_streak` to calculate streak retention.

### `ielts_custom_gemini_key`
- **Type**: `string`
- **Description**: User-provided Google Gemini API key. Used to bypass shared rate limits. Validated to ensure it begins with `AIza`.

### `ielts_vocabulary`
- **Type**: `Array<Vocab>` (JSON String)
- **Schema**:
  ```ts
  type Vocab = {
    word: string;
    definition: string;
    example: string;
    next_review_date: string; // ISO 8601
    interval: number;
    ease_factor: number;
    repetitions: number;
  }
  ```
- **Description**: Tracks the user's spaced repetition flashcards. The SuperMemo-2 (SM-2) algorithm fields (`interval`, `ease_factor`, `repetitions`) update after every review session.

### `ielts_reading_daily_v2`
- **Type**: `Object` (JSON String)
- **Schema**:
  ```ts
  {
    date: string; // YYYY-MM-DD
    passage: string; // Markdown text
    questions: Array<Object>;
    answers: Record<string, string>;
  }
  ```
- **Description**: Caches the daily auto-generated Reading module passage and questions. Prevents regenerating a new test on every page refresh if the date matches today.

### `ielts_speaking_daily_{part1|part2|part3}`
- **Type**: `Object` (JSON String)
- **Schema**:
  ```ts
  {
    date: string; // YYYY-MM-DD
    text: string; // Formatted prompt text
  }
  ```
- **Description**: Caches the daily auto-generated Speaking prompts per part. Prevents regenerating a new prompt on every page refresh.

### `ielts_simulation_v1`
- **Type**: `Object` (JSON String)
- **Schema**:
  ```ts
  {
    inProgress: boolean;
    currentSection: string;
    timeRemaining: number;
    answers: Record<string, string>;
  }
  ```
- **Description**: Saves the progress of a full mock exam so a user can accidentally close the tab and resume their exam without losing data.
