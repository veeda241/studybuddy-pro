import { getKeywords, splitSentences, tokenize } from './tokenize';
import { TermWeights, cosineSimilarity, tfidfVector, buildIdf, vectorizeDocuments } from './tfidf';

export interface IndexedChunk {
  text: string;
  termWeights: TermWeights;
}

export function indexNote(notes: string): IndexedChunk[] {
  const sentences = splitSentences(notes);
  if (!sentences.length) return [];

  const vectors = vectorizeDocuments(sentences);
  return sentences.map((text, i) => ({
    text,
    termWeights: vectors[i],
  }));
}

export function retrieveTopChunks(
  chunks: IndexedChunk[],
  query: string,
  topK = 5
): IndexedChunk[] {
  if (!chunks.length) return [];

  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return chunks.slice(0, topK);
  }

  const corpusTokens = chunks.map((chunk) => tokenize(chunk.text));
  const idf = buildIdf([...corpusTokens, queryTokens]);
  const queryVec = tfidfVector(queryTokens, idf);

  return [...chunks]
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryVec, chunk.termWeights),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}

export function retrieveForKeywords(
  chunks: IndexedChunk[],
  keywords: string[],
  topK = 6
): IndexedChunk[] {
  if (!keywords.length) return chunks.slice(0, topK);
  return retrieveTopChunks(chunks, keywords.join(' '), topK);
}

export function buildRetrievalQuery(notes: string, keywordCount = 8): string {
  return getKeywords(notes, keywordCount).join(' ');
}
