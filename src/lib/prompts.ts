export const PROMPTS = {
  essayEvaluation: (taskType: string) => `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams based on the latest Cambridge IELTS standards.
Grade the following essay based strictly on the official IELTS public band descriptors. 
Be highly critical. Do not inflate scores.

The essay is a ${taskType === 'task1' ? 'Task 1 (Report/Letter)' : 'Task 2 (Essay)'}.

Output your evaluation strictly in the following JSON format. Do NOT wrap it in markdown block quotes, return raw JSON.
{
  "estimatedBand": 6.5,
  "taskAchievement": { "score": 6.5, "feedback": "..." },
  "coherenceCohesion": { "score": 6.0, "feedback": "..." },
  "lexicalResource": { "score": 7.0, "feedback": "..." },
  "grammaticalRange": { "score": 6.5, "feedback": "..." },
  "overallFeedback": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}
`,
  speakingEvaluation: `
You are an expert, highly strict IELTS examiner with years of experience grading Academic and General Training exams based on the latest Cambridge IELTS standards.
Listen to the provided audio carefully.
First, provide a transcript of what the student said.
Then, grade the spoken response strictly based on the official IELTS public band descriptors for Speaking.

Output your evaluation strictly in the following JSON format. Do NOT wrap it in markdown block quotes, return raw JSON.
{
  "transcript": "...",
  "estimatedBand": 6.5,
  "fluencyAndCoherence": { "score": 6.5, "feedback": "..." },
  "lexicalResource": { "score": 7.0, "feedback": "..." },
  "grammaticalRange": { "score": 6.0, "feedback": "..." },
  "pronunciation": { "score": 6.5, "feedback": "..." },
  "overallFeedback": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}
`,
  vocabulary: (seed: number) => `Generate exactly 10 highly pragmatic, Band 7-8 level English vocabulary words that are highly relevant for the IELTS test.
  Focus ONLY on high-utility words frequently found in recent Cambridge IELTS exams (e.g., words for describing trends in Writing Task 1, arguing points in Task 2, or common reading topics). 
  Do NOT provide overly complicated, archaic, or native-only idioms that are not practically used in academic IELTS.
  Make sure to generate a completely unique set of words (Random seed: ${seed}).
  Return ONLY raw JSON in this exact format:
  [{"word": "string", "meaning": "string", "example": "string", "synonyms": "string (comma separated)", "antonyms": "string (comma separated)"}]
  Do NOT wrap in markdown.`,
  reading: (difficultyContext: string, startNum: number, numQuestions: number) => `You are an expert Cambridge IELTS test creator.
Write an authentic 600-word academic IELTS reading passage about ${difficultyContext}
The passage should be highly formal and contain 4-5 well-structured paragraphs.
Then, create exactly ${numQuestions} authentic IELTS questions based on the passage. Use a mix of TRUE/FALSE/NOT GIVEN, multiple choice, and fill-in-the-blanks.
The questions must be numbered from ${startNum} to ${startNum + numQuestions - 1}.
Return ONLY raw JSON in this exact format, with no markdown:
{
  "title": "string",
  "passage": "string (use \\n\\n for paragraphs)",
  "questions": [
    {
      "num": number, 
      "q": "string (use ___ for blanks if applicable)", 
      "type": "multiple_choice | true_false | fill_blank",
      "options": ["string", "string", "string", "string"], 
      "answer": "string"
    }
  ]
}`,
  speakingPart1: `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 1 section. 
Choose ONE highly common recent IELTS topic (e.g., Work/Studies, Hometown, Weather, Hobbies, Technology).
Generate exactly 4 questions.
Return ONLY raw JSON: {"topic": "string", "questions": ["string", "string", "string", "string"]}`,
  speakingPart2: `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 2 cue card (Task).
The topic should be a recent, standard IELTS topic (e.g., Describe a person, an object, an event, or a place).
Provide the main prompt and exactly 4 bullet points.
Return ONLY raw JSON: {"topic": "string", "bullets": ["string", "string", "string", "string"]}`,
  speakingPart3: `You are a Cambridge IELTS examiner. Generate an authentic IELTS Speaking Part 3 discussion section.
Choose a complex, abstract topic related to a typical Part 2 topic (e.g., Society, Education, Environment, Media).
Generate exactly 4 deep, analytical questions that ask the candidate to evaluate, compare, or predict.
Return ONLY raw JSON: {"topic": "string", "questions": ["string", "string", "string", "string"]}`,
  listening: (context: string, startNum: number) => `You are an expert Cambridge IELTS test creator.
Write an authentic IELTS Listening ${context}
The dialogue MUST include natural speech features (self-correction, hesitation, spelling out names/numbers if Part 1).
It should be about 400 words long. 
Also generate exactly 10 questions based on the script. 
The questions must be numbered from ${startNum} to ${startNum + 9}.
The answers must be STRICTLY 1, 2, or 3 words/numbers and must appear exactly as spoken in the audio.
Provide the text with standard speaker labels (e.g. Speaker 1:, Speaker 2:).

CRITICAL INSTRUCTION: Do NOT include any reasoning, thinking process, hints, or chain of thought inside the JSON fields. The "q" field must contain ONLY the question text (with ___ for the blank). The "answer" field must contain ONLY the final answer.

Return ONLY raw JSON in this format:
{
  "title": "string",
  "script": [{"speaker": "string", "text": "string"}],
  "questions": [{"num": number, "q": "string (use ___ for the blank)", "answer": "string"}]
}`,
  writingTask1: `You are an expert Cambridge IELTS test creator. Generate an authentic IELTS Academic Writing Task 1 prompt with complete visual data.
The prompt must ask the candidate to summarize a bar chart, line graph, or pie chart.
Provide:
1. "prompt": Authentic Cambridge prompt text. For example: "The chart below shows the percentage of households with access to the internet in four countries between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words."
2. "chartType": "line", "bar", or "pie"
3. "chartTitle": A descriptive title for the chart (e.g., "Percentage of Households with Internet Access (2005–2020)")
4. "xAxisLabel": Axis label (e.g., "Year" or "Category")
5. "yAxisLabel": Axis label (e.g., "Percentage (%)" or "Visits in Millions")
6. "categories": Array of x-axis categories or years (e.g., ["2005", "2010", "2015", "2020"])
7. "series": Array of datasets with "name" and "data" array of numbers matching categories length (e.g., [{"name": "United Kingdom", "data": [60, 75, 88, 95]}, {"name": "United States", "data": [68, 79, 87, 93]}])

Return ONLY raw JSON in this structure:
{
  "prompt": "The chart below shows...",
  "chartType": "line",
  "chartTitle": "string",
  "xAxisLabel": "string",
  "yAxisLabel": "string",
  "categories": ["2005", "2010", "2015", "2020"],
  "series": [
    {"name": "Country A", "data": [60, 75, 88, 95]},
    {"name": "Country B", "data": [68, 79, 87, 93]}
  ]
}`,
  writingTask2: `You are an expert Cambridge IELTS test creator. Generate an authentic IELTS Academic Writing Task 2 essay prompt.
The prompt must be on a recent, complex issue (e.g., Globalization, Technology in Education, Government funding, Crime).
It must follow a classic IELTS structure (e.g., "To what extent do you agree?", "Discuss both views and give your opinion", or "What are the causes and solutions?").
Return ONLY raw JSON: {"prompt": "string"}`
};
