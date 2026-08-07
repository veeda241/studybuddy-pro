import {
  generateFlashcards as heuristicFlashcards,
  generateQuiz as heuristicQuiz,
  generateSummary as heuristicSummary,
  GeneratedFlashcard,
  GeneratedQuizQuestion,
  prepareNote,
} from './generate';
import {
  localLlmFlashcards,
  localLlmQuiz,
  localLlmSummary,
  loadLocalModel,
} from './localLlm';

export type GenerationProvider = 'local-llm' | 'heuristic';

export async function ensureLocalModel(onProgress?: (message: string, progress?: number) => void) {
  return loadLocalModel(onProgress);
}

export async function smartSummary(
  notes: string
): Promise<{ content: string; provider: GenerationProvider }> {
  try {
    const content = await localLlmSummary(notes);
    if (content.trim()) return { content, provider: 'local-llm' };
  } catch (err) {
    console.warn('Local LLM summary failed, using heuristic NLP:', err);
  }
  return { content: heuristicSummary(notes), provider: 'heuristic' };
}

export async function smartFlashcards(
  notes: string
): Promise<{ flashcards: GeneratedFlashcard[]; provider: GenerationProvider }> {
  try {
    const flashcards = await localLlmFlashcards(notes);
    if (flashcards.length) return { flashcards, provider: 'local-llm' };
  } catch (err) {
    console.warn('Local LLM flashcards failed, using heuristic NLP:', err);
  }
  return { flashcards: heuristicFlashcards(notes), provider: 'heuristic' };
}

export async function smartQuiz(
  notes: string
): Promise<{ questions: GeneratedQuizQuestion[]; provider: GenerationProvider }> {
  try {
    const questions = await localLlmQuiz(notes);
    if (questions.length) return { questions, provider: 'local-llm' };
  } catch (err) {
    console.warn('Local LLM quiz failed, using heuristic NLP:', err);
  }
  return { questions: heuristicQuiz(notes), provider: 'heuristic' };
}

export { prepareNote };
