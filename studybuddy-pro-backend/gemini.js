const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getApiKey() {
  const key = process.env.GOOGLE_GENAI_API_KEY || '';
  if (!key || key.includes('YOUR_') || key.trim() === '') {
    return null;
  }
  return key.trim();
}

function isGeminiConfigured() {
  return Boolean(getApiKey());
}

function getModel(jsonMode = true) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      temperature: 0.4,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });
}

function buildContext(notes, retrievedChunks = []) {
  const chunks = (retrievedChunks || []).map((c) => (typeof c === 'string' ? c : c.text)).filter(Boolean);
  if (chunks.length) {
    return chunks.map((text, i) => `[${i + 1}] ${text}`).join('\n');
  }
  return String(notes || '').slice(0, 12000);
}

function parseJson(text) {
  const raw = String(text || '').trim();
  try {
    return JSON.parse(raw);
  } catch (_) {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('Gemini returned non-JSON output');
    return JSON.parse(match[0]);
  }
}

async function generateSummary(notes, retrievedChunks = []) {
  const model = getModel(true);
  if (!model) return null;

  const context = buildContext(notes, retrievedChunks);
  const prompt = `You are StudyBuddy Pro, an educational assistant.
Summarize the study notes in 2-4 concise sentences for quick review.
Use ONLY the provided context. Return JSON: {"content":"summary text"}

Context:
${context}`;

  const result = await model.generateContent(prompt);
  const data = parseJson(result.response.text());
  if (!data.content) throw new Error('Empty summary from Gemini');
  return { content: String(data.content), provider: 'gemini', model: MODEL_ID };
}

async function generateFlashcards(notes, retrievedChunks = [], limit = 10) {
  const model = getModel(true);
  if (!model) return null;

  const context = buildContext(notes, retrievedChunks);
  const prompt = `You are StudyBuddy Pro, an educational assistant.
Create up to ${limit} high-quality flashcards from the study notes.
Each card needs a clear question and a short accurate answer grounded in the context.
Return JSON: {"flashcards":[{"question":"...","answer":"..."}]}

Context:
${context}`;

  const result = await model.generateContent(prompt);
  const data = parseJson(result.response.text());
  const flashcards = Array.isArray(data) ? data : data.flashcards;
  if (!Array.isArray(flashcards) || !flashcards.length) {
    throw new Error('Empty flashcards from Gemini');
  }

  return {
    flashcards: flashcards
      .filter((card) => card && card.question && card.answer)
      .slice(0, limit)
      .map((card) => ({
        question: String(card.question).trim(),
        answer: String(card.answer).trim(),
      })),
    provider: 'gemini',
    model: MODEL_ID,
  };
}

async function generateQuiz(notes, retrievedChunks = [], limit = 5) {
  const model = getModel(true);
  if (!model) return null;

  const context = buildContext(notes, retrievedChunks);
  const prompt = `You are StudyBuddy Pro, an educational assistant.
Create ${limit} multiple-choice quiz questions from the study notes.
Each question must have exactly 4 options and one correct answer that exactly matches one option.
Ground every question in the context. Avoid trick wording.
Return JSON: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":"one of the options"}]}

Context:
${context}`;

  const result = await model.generateContent(prompt);
  const data = parseJson(result.response.text());
  const questions = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error('Empty quiz from Gemini');
  }

  const normalized = questions
    .map((q) => {
      const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
      const answer = String(q.answer || '').trim();
      if (!q.question || options.length < 2 || !answer) return null;
      const uniqueOptions = [...new Set(options)].slice(0, 4);
      if (!uniqueOptions.includes(answer)) {
        uniqueOptions[0] = answer;
      }
      while (uniqueOptions.length < 4) {
        uniqueOptions.push(`Option ${uniqueOptions.length + 1}`);
      }
      return {
        question: String(q.question).trim(),
        options: uniqueOptions,
        answer,
      };
    })
    .filter(Boolean)
    .slice(0, limit);

  if (!normalized.length) throw new Error('Could not normalize Gemini quiz output');

  return { questions: normalized, provider: 'gemini', model: MODEL_ID };
}

module.exports = {
  MODEL_ID,
  isGeminiConfigured,
  generateSummary,
  generateFlashcards,
  generateQuiz,
};
