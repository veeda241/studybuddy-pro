export const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
  'will', 'just', 'don', 'should', 'now',
]);

export function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

export function splitSentences(notes: string): string[] {
  const cleaned = String(notes || '')
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((part) => part.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean);

  if (cleaned.length > 1) return cleaned;

  return String(notes || '')
    .split(/[.!?;]+|,(?=\s+[A-Z])/)
    .map((part) => part.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
    .filter(Boolean);
}

export function getKeywords(text: string, count = 5): string[] {
  const freq: Record<string, number> = {};
  for (const word of tokenize(text)) {
    freq[word] = (freq[word] || 0) + 1;
  }
  return Object.keys(freq)
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, count);
}
