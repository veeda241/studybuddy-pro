import { env, pipeline } from '@xenova/transformers';
import { prepareNote } from './generate';
import { retrieveTopChunks } from './rag';
import type { GeneratedFlashcard, GeneratedQuizQuestion } from './generate';

/** Lightweight instruction model (~60MB quantized ONNX). */
export const LOCAL_MODEL_ID = 'Xenova/flan-t5-small';

export type LocalModelStatus = 'idle' | 'loading' | 'ready' | 'error';

type ProgressCallback = (message: string, progress?: number) => void;
type Text2TextGenerator = (
  input: string,
  options?: Record<string, unknown>
) => Promise<Array<{ generated_text: string }>>;

let generatorPromise: Promise<Text2TextGenerator> | null = null;
let status: LocalModelStatus = 'idle';
let lastError = '';

// Prefer vendored weights in /public/models when present; otherwise download once from Hugging Face.
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;

const configureModelPaths = () => {
  env.localModelPath = `${process.env.PUBLIC_URL || ''}/models/`;
};

export function getLocalModelStatus(): { status: LocalModelStatus; error: string; modelId: string } {
  return { status, error: lastError, modelId: LOCAL_MODEL_ID };
}

export async function loadLocalModel(onProgress?: ProgressCallback): Promise<Text2TextGenerator> {
  if (generatorPromise) return generatorPromise;

  status = 'loading';
  lastError = '';
  configureModelPaths();

  generatorPromise = (async () => {
    onProgress?.('Downloading lightweight model (first time only)...', 0);
    try {
      const generator = (await pipeline('text2text-generation', LOCAL_MODEL_ID, {
        quantized: true,
        progress_callback: (data: { status?: string; progress?: number; file?: string }) => {
          if (data.status === 'progress' && typeof data.progress === 'number') {
            onProgress?.(`Loading ${data.file || 'model'}...`, data.progress);
          } else if (data.status === 'ready') {
            onProgress?.('Model ready', 100);
          }
        },
      })) as Text2TextGenerator;
      status = 'ready';
      onProgress?.('Model ready', 100);
      return generator;
    } catch (err) {
      status = 'error';
      lastError = err instanceof Error ? err.message : String(err);
      generatorPromise = null;
      throw err;
    }
  })();

  return generatorPromise;
}

const clean = (text: string) =>
  String(text || '')
    .replace(/^(question|answer|summary)\s*:\s*/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

async function generateOnce(prompt: string, maxNewTokens = 64): Promise<string> {
  const generator = await loadLocalModel();
  const result = await generator(prompt, {
    max_new_tokens: maxNewTokens,
    temperature: 0.2,
  });
  const row = Array.isArray(result) ? result[0] : result;
  return clean((row as { generated_text?: string }).generated_text || String(row));
}

export async function localLlmSummary(notes: string): Promise<string> {
  const { retrieved, chunks } = prepareNote(notes);
  const source = (retrieved.length ? retrieved : chunks)
    .slice(0, 4)
    .map((c) => c.text)
    .join(' ');
  const clipped = source.slice(0, 800);
  const out = await generateOnce(`summarize: ${clipped}`, 80);
  return out || clipped.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
}

export async function localLlmFlashcards(notes: string, limit = 8): Promise<GeneratedFlashcard[]> {
  const { retrieved, chunks } = prepareNote(notes);
  const pool = (retrieved.length ? retrieved : chunks).slice(0, limit);
  const flashcards: GeneratedFlashcard[] = [];

  for (const chunk of pool) {
    const fact = chunk.text.slice(0, 280);
    const question = await generateOnce(`Generate one short study question for this fact: ${fact}`, 40);
    if (!question || question.length < 8) continue;
    flashcards.push({
      question: question.endsWith('?') ? question : `${question}?`,
      answer: fact.trim(),
    });
  }

  return flashcards;
}

export async function localLlmQuiz(notes: string, limit = 5): Promise<GeneratedQuizQuestion[]> {
  const { retrieved, chunks } = prepareNote(notes);
  const pool = retrieved.length ? retrieved : chunks;
  if (pool.length < 2) {
    throw new Error('Add a little more detail so StudyBuddy can build questions.');
  }

  const questions: GeneratedQuizQuestion[] = [];
  const selected = pool.slice(0, limit);

  for (const chunk of selected) {
    const fact = chunk.text.slice(0, 280);
    const questionText = await generateOnce(`Create one multiple choice stem about: ${fact}`, 48);
    if (!questionText || questionText.length < 8) continue;

    const distractors = pool
      .filter((c) => c.text !== chunk.text)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((c) => c.text.trim().slice(0, 140));

    while (distractors.length < 3) {
      distractors.push('Not mentioned in the notes');
    }

    const answer = fact.trim().slice(0, 140);
    const options = [answer, ...distractors]
      .filter((option, index, list) => option && list.indexOf(option) === index)
      .slice(0, 4)
      .sort(() => 0.5 - Math.random());

    if (!options.includes(answer)) options[0] = answer;

    questions.push({
      question: questionText.endsWith('?') ? questionText : `${questionText}?`,
      options,
      answer,
    });
  }

  if (!questions.length) {
    throw new Error('Local model could not build questions from these notes.');
  }

  return questions;
}

/** Answer a student doubt using retrieved note context + Flan-T5. */
export async function localLlmAnswerDoubt(
  question: string,
  notesCorpus: string
): Promise<{ answer: string; usedContext: string[] }> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error('Ask a question about your notes.');

  const { chunks } = prepareNote(notesCorpus || trimmed);
  const retrieved = notesCorpus ? retrieveTopChunks(chunks, trimmed, 4) : [];

  const contextBits = retrieved.map((c) => c.text.trim()).filter(Boolean);
  const context = contextBits.join(' ').slice(0, 700);

  let answer = '';
  try {
    if (context) {
      answer = await generateOnce(
        `Context: ${context}\n\nQuestion: ${trimmed}\n\nAnswer:`,
        96
      );
    }
    if (!answer || answer.length < 6) {
      answer = await generateOnce(`Answer this student doubt briefly: ${trimmed}`, 96);
    }
  } catch (_) {
    // fall through to heuristic
  }

  if (!answer || answer.length < 6) {
    if (contextBits.length) {
      answer = `Based on your notes: ${contextBits[0]}`;
    } else {
      answer =
        'I could not find matching notes for that doubt. Upload or paste study notes first, then ask again.';
    }
  }

  return { answer, usedContext: contextBits.slice(0, 3) };
}
