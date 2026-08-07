/**
 * Read uploaded study files into plain text for notes / RAG.
 * Supports: .txt .md .csv .json .html and .pdf
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';

// Worker is served from public/ for CRA + GitHub Pages basename.
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'csv',
  'json',
  'html',
  'htm',
  'text',
  'log',
]);

export const ACCEPTED_NOTE_TYPES =
  '.txt,.md,.markdown,.csv,.json,.html,.pdf,text/plain,text/markdown,application/pdf';

function extensionOf(file: File): string {
  const parts = file.name.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const data = await readAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .filter(Boolean)
      .join(' ');
    if (line.trim()) pages.push(line.trim());
  }

  const text = pages.join('\n\n').trim();
  if (!text) {
    throw new Error('No readable text found in this PDF (it may be image-only).');
  }
  return text;
}

export async function extractTextFromFile(file: File): Promise<{ text: string; title: string }> {
  const ext = extensionOf(file);
  const title = file.name.replace(/\.[^.]+$/, '') || file.name;

  if (ext === 'pdf' || file.type === 'application/pdf') {
    const text = await extractPdfText(file);
    return { text, title };
  }

  if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/') || file.type === 'application/json') {
    const text = (await readAsText(file)).trim();
    if (!text) throw new Error('The selected file is empty.');
    return { text, title };
  }

  throw new Error('Unsupported file type. Upload .txt, .md, .csv, .json, .html, or .pdf');
}
