import React, { useState, useEffect } from 'react';
import { smartSummary } from '../lib/nlp/smartGenerate';

interface NoteSummarizerProps {
  notes: string;
}

const NoteSummarizer: React.FC<NoteSummarizerProps> = ({ notes }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    if (notes.trim() === '') {
      setSummary('');
      setProvider('');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    const handler = setTimeout(async () => {
      try {
        const result = await smartSummary(notes);
        if (!cancelled) {
          setSummary(result.content);
          setProvider(result.provider);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to generate summary. Please try again.');
          console.error('Summarization error:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [notes]);

  return (
    <section className="summary-panel">
      <span className="eyebrow">Summary{provider ? ` · ${provider === 'local-llm' ? 'Flan-T5' : 'Heuristic'}` : ''}</span>
      {loading && <p>Summarizing...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && <p>{summary}</p>}
    </section>
  );
};

export default NoteSummarizer;
