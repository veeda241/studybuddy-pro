import { tokenize } from './tokenize';

export type TermWeights = Record<string, number>;

export function termFrequency(tokens: string[]): TermWeights {
  const tf: TermWeights = {};
  if (!tokens.length) return tf;
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  const len = tokens.length;
  for (const key of Object.keys(tf)) {
    tf[key] = tf[key] / len;
  }
  return tf;
}

export function buildIdf(documents: string[][]): TermWeights {
  const df: TermWeights = {};
  const n = documents.length || 1;
  for (const doc of documents) {
    const unique = new Set(doc);
    unique.forEach((term) => {
      df[term] = (df[term] || 0) + 1;
    });
  }
  const idf: TermWeights = {};
  for (const term of Object.keys(df)) {
    idf[term] = Math.log((n + 1) / (df[term] + 1)) + 1;
  }
  return idf;
}

export function tfidfVector(tokens: string[], idf: TermWeights): TermWeights {
  const tf = termFrequency(tokens);
  const weights: TermWeights = {};
  for (const term of Object.keys(tf)) {
    weights[term] = tf[term] * (idf[term] || 1);
  }
  return weights;
}

export function cosineSimilarity(a: TermWeights, b: TermWeights): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const term of Object.keys(a)) {
    normA += a[term] * a[term];
    if (b[term]) dot += a[term] * b[term];
  }
  for (const term of Object.keys(b)) {
    normB += b[term] * b[term];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function vectorizeDocuments(texts: string[]): TermWeights[] {
  const tokenDocs = texts.map((text) => tokenize(text));
  const idf = buildIdf(tokenDocs);
  return tokenDocs.map((tokens) => tfidfVector(tokens, idf));
}
