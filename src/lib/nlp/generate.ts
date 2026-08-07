import { getKeywords } from './tokenize';
import { IndexedChunk, buildRetrievalQuery, indexNote, retrieveForKeywords } from './rag';

export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface GenerationResult {
  chunks: IndexedChunk[];
  keywords: string[];
  retrieved: IndexedChunk[];
}

const makeKeywordOptions = (keywords: string[], answer: string): string[] => {
  const fallback = ['definition', 'example', 'timeline', 'formula', 'contrast', 'summary'];
  return [answer, ...keywords.filter((keyword) => keyword !== answer), ...fallback]
    .filter((option, index, list) => option && list.indexOf(option) === index)
    .slice(0, 4)
    .sort(() => 0.5 - Math.random());
};

export function prepareNote(notes: string): GenerationResult {
  const chunks = indexNote(notes);
  const keywords = getKeywords(notes, Math.max(chunks.length, 8));
  const retrieved = retrieveForKeywords(chunks, keywords, Math.min(8, Math.max(chunks.length, 1)));
  return { chunks, keywords, retrieved };
}

export function generateSummary(notes: string): string {
  if (!notes.trim()) return '';
  const { retrieved, chunks } = prepareNote(notes);
  const source = retrieved.length ? retrieved : chunks;
  return source
    .slice(0, 2)
    .map((chunk) => chunk.text)
    .join(' ');
}

export function generateFlashcards(notes: string, limit = 10): GeneratedFlashcard[] {
  if (!notes.trim()) return [];

  const { keywords, retrieved, chunks } = prepareNote(notes);
  const pool = retrieved.length ? retrieved : chunks;
  const flashcards: GeneratedFlashcard[] = [];
  const used = new Set<string>();

  for (const keyword of keywords) {
    const sentence =
      pool.find((c) => c.text.toLowerCase().includes(keyword)) ||
      chunks.find((c) => c.text.toLowerCase().includes(keyword));
    if (!sentence || used.has(sentence.text)) continue;
    used.add(sentence.text);
    flashcards.push({
      question: `What is the significance of "${keyword}"?`,
      answer: sentence.text.trim(),
    });
    if (flashcards.length >= limit) break;
  }

  if (flashcards.length < Math.min(3, pool.length)) {
    for (const chunk of pool) {
      if (used.has(chunk.text)) continue;
      const kw = getKeywords(chunk.text, 1)[0] || 'this idea';
      flashcards.push({
        question: `Explain: "${kw}"`,
        answer: chunk.text.trim(),
      });
      used.add(chunk.text);
      if (flashcards.length >= limit) break;
    }
  }

  return flashcards;
}

export function generateQuiz(notes: string, limit = 5): GeneratedQuizQuestion[] {
  if (!notes.trim()) {
    throw new Error('Add a little more detail so StudyBuddy can build questions.');
  }

  const { keywords, retrieved, chunks } = prepareNote(notes);
  const pool = retrieved.length ? retrieved : chunks;

  if (!pool.length || !keywords.length) {
    throw new Error('Add a little more detail so StudyBuddy can build questions.');
  }

  const questions: GeneratedQuizQuestion[] = [];
  const query = buildRetrievalQuery(notes);

  for (let i = 0; i < Math.min(keywords.length, limit); i++) {
    const keyword = keywords[i];
    const ranked = retrieveForKeywords(chunks, [keyword, ...query.split(' ')], 4);
    const answerChunk =
      ranked.find((c) => c.text.toLowerCase().includes(keyword)) ||
      pool.find((c) => c.text.toLowerCase().includes(keyword));
    if (!answerChunk) continue;

    const otherChunks = chunks.filter((c) => c.text !== answerChunk.text);
    const wrongOptions = otherChunks
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((c) => c.text.trim());

    if (wrongOptions.length < 3) {
      questions.push({
        question: `Which key term is connected to this note: "${answerChunk.text.trim()}"?`,
        options: makeKeywordOptions(keywords, keyword),
        answer: keyword,
      });
      continue;
    }

    const options = [answerChunk.text.trim(), ...wrongOptions].sort(() => 0.5 - Math.random());
    questions.push({
      question: `Which statement is true regarding "${keyword}"?`,
      options,
      answer: answerChunk.text.trim(),
    });
  }

  if (!questions.length) {
    throw new Error('Add a little more detail so StudyBuddy can build questions.');
  }

  return questions;
}
