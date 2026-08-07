import Dexie, { Table } from 'dexie';

export interface StudyNote {
  id?: number;
  userId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudyChunk {
  id?: number;
  noteId: number;
  text: string;
  termWeights: Record<string, number>;
}

export interface StudyDeck {
  id?: number;
  userId: string;
  noteId: number;
  title: string;
  createdAt: number;
}

export interface StudyFlashcard {
  id?: number;
  userId: string;
  noteId: number;
  deckId: number;
  question: string;
  answer: string;
  ease: number;
  interval: number;
  repetitions: number;
  dueAt: number;
  lastReviewedAt: number | null;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface StudyQuiz {
  id?: number;
  userId: string;
  noteId: number;
  title: string;
  questions: QuizQuestion[];
  bestScore: number | null;
  createdAt: number;
}

export interface StudyTask {
  id?: number;
  userId: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id?: number;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

class StudyBuddyDB extends Dexie {
  notes!: Table<StudyNote, number>;
  chunks!: Table<StudyChunk, number>;
  decks!: Table<StudyDeck, number>;
  flashcards!: Table<StudyFlashcard, number>;
  quizzes!: Table<StudyQuiz, number>;
  tasks!: Table<StudyTask, number>;
  chatMessages!: Table<ChatMessage, number>;

  constructor() {
    super('StudyBuddyPro');
    this.version(1).stores({
      notes: '++id, userId, updatedAt',
      chunks: '++id, noteId',
      decks: '++id, userId, noteId, createdAt',
      flashcards: '++id, userId, noteId, deckId, dueAt',
      quizzes: '++id, userId, noteId, createdAt',
      tasks: '++id, userId, createdAt',
    });
    this.version(2).stores({
      notes: '++id, userId, updatedAt',
      chunks: '++id, noteId',
      decks: '++id, userId, noteId, createdAt',
      flashcards: '++id, userId, noteId, deckId, dueAt',
      quizzes: '++id, userId, noteId, createdAt',
      tasks: '++id, userId, createdAt',
      chatMessages: '++id, userId, createdAt',
    });
  }
}

export const studyDb = new StudyBuddyDB();

const noteTitleFromContent = (content: string): string => {
  const firstLine = content.trim().split(/\n/)[0] || 'Untitled note';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
};

export async function upsertNoteWithChunks(
  userId: string,
  content: string,
  chunks: Array<{ text: string; termWeights: Record<string, number> }>,
  existingNoteId?: number
): Promise<number> {
  const now = Date.now();
  const title = noteTitleFromContent(content);

  let noteId = existingNoteId;
  if (noteId) {
    await studyDb.notes.update(noteId, { content, title, updatedAt: now });
    await studyDb.chunks.where('noteId').equals(noteId).delete();
  } else {
    noteId = await studyDb.notes.add({
      userId,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (chunks.length) {
    await studyDb.chunks.bulkAdd(
      chunks.map((chunk) => ({
        noteId: noteId!,
        text: chunk.text,
        termWeights: chunk.termWeights,
      }))
    );
  }

  return noteId!;
}

export async function getNotesForUser(userId: string): Promise<StudyNote[]> {
  return studyDb.notes.where('userId').equals(userId).reverse().sortBy('updatedAt');
}

export async function getDecksForUser(userId: string): Promise<StudyDeck[]> {
  return studyDb.decks.where('userId').equals(userId).reverse().sortBy('createdAt');
}

export async function getQuizzesForUser(userId: string): Promise<StudyQuiz[]> {
  return studyDb.quizzes.where('userId').equals(userId).reverse().sortBy('createdAt');
}

export async function getFlashcardsForDeck(deckId: number): Promise<StudyFlashcard[]> {
  return studyDb.flashcards.where('deckId').equals(deckId).toArray();
}

export async function getDueFlashcards(userId: string, now = Date.now()): Promise<StudyFlashcard[]> {
  return studyDb.flashcards
    .where('userId')
    .equals(userId)
    .filter((card) => card.dueAt <= now)
    .sortBy('dueAt');
}

export async function countDueFlashcards(userId: string, now = Date.now()): Promise<number> {
  const due = await getDueFlashcards(userId, now);
  return due.length;
}

export async function saveFlashcardDeck(
  userId: string,
  noteId: number,
  title: string,
  cards: Array<{ question: string; answer: string }>
): Promise<{ deckId: number; flashcards: StudyFlashcard[] }> {
  const now = Date.now();
  const deckId = await studyDb.decks.add({
    userId,
    noteId,
    title,
    createdAt: now,
  });

  const records: StudyFlashcard[] = cards.map((card) => ({
    userId,
    noteId,
    deckId,
    question: card.question,
    answer: card.answer,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    dueAt: now,
    lastReviewedAt: null,
  }));

  await studyDb.flashcards.bulkAdd(records);
  const flashcards = await getFlashcardsForDeck(deckId);
  return { deckId, flashcards };
}

export async function saveQuiz(
  userId: string,
  noteId: number,
  title: string,
  questions: QuizQuestion[]
): Promise<number> {
  return studyDb.quizzes.add({
    userId,
    noteId,
    title,
    questions,
    bestScore: null,
    createdAt: Date.now(),
  });
}

export async function updateQuizScore(quizId: number, score: number): Promise<void> {
  const quiz = await studyDb.quizzes.get(quizId);
  if (!quiz) return;
  const bestScore = quiz.bestScore == null ? score : Math.max(quiz.bestScore, score);
  await studyDb.quizzes.update(quizId, { bestScore });
}

export async function updateFlashcardReview(
  cardId: number,
  updates: Pick<StudyFlashcard, 'ease' | 'interval' | 'repetitions' | 'dueAt' | 'lastReviewedAt'>
): Promise<void> {
  await studyDb.flashcards.update(cardId, updates);
}

export async function getTasksForUser(userId: string): Promise<StudyTask[]> {
  return studyDb.tasks.where('userId').equals(userId).sortBy('createdAt');
}

export async function addTask(userId: string, text: string): Promise<StudyTask> {
  const task: StudyTask = {
    userId,
    text,
    completed: false,
    createdAt: Date.now(),
  };
  const id = await studyDb.tasks.add(task);
  return { ...task, id };
}

export async function updateTask(
  taskId: number,
  updates: Partial<Pick<StudyTask, 'text' | 'completed'>>
): Promise<void> {
  await studyDb.tasks.update(taskId, updates);
}

export async function deleteTask(taskId: number): Promise<void> {
  await studyDb.tasks.delete(taskId);
}

export async function getChatMessages(userId: string): Promise<ChatMessage[]> {
  return studyDb.chatMessages.where('userId').equals(userId).sortBy('createdAt');
}

export async function addChatMessage(
  userId: string,
  role: ChatMessage['role'],
  content: string
): Promise<ChatMessage> {
  const message: ChatMessage = {
    userId,
    role,
    content,
    createdAt: Date.now(),
  };
  const id = await studyDb.chatMessages.add(message);
  return { ...message, id };
}

export async function clearChatMessages(userId: string): Promise<void> {
  await studyDb.chatMessages.where('userId').equals(userId).delete();
}

export async function getAllNoteTextForUser(userId: string): Promise<string> {
  const notes = await getNotesForUser(userId);
  return notes.map((note) => `## ${note.title}\n${note.content}`).join('\n\n');
}
