import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import NoteFileUpload from './NoteFileUpload';
import { useAuth } from '../context/AuthContext';
import { prepareNote, smartQuiz } from '../lib/nlp/smartGenerate';
import { QuizQuestion, saveQuiz, upsertNoteWithChunks } from '../lib/studyDb';

interface QuizGeneratorProps {
  onQuizGenerated: (questions: QuizQuestion[], meta: { noteId: number; quizId: number }) => void;
  onNotesSubmitted: (notes: string) => void;
  notes?: string;
  existingNoteId?: number | null;
  onNotesChange?: (notes: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  onQuizGenerated,
  onNotesSubmitted,
  notes: controlledNotes,
  existingNoteId,
  onNotesChange,
}) => {
  const { user } = useAuth();
  const [internalNotes, setInternalNotes] = useState('');
  const notes = controlledNotes !== undefined ? controlledNotes : internalNotes;
  const setNotes = onNotesChange || setInternalNotes;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');

  const handleGenerate = async () => {
    if (!user) {
      setError('Please log in to save quizzes locally.');
      return;
    }

    setLoading(true);
    setError('');
    setProvider('');
    onNotesSubmitted(notes);

    try {
      const { questions, provider: usedProvider } = await smartQuiz(notes);
      setProvider(usedProvider);
      const prepared = prepareNote(notes);
      const noteId = await upsertNoteWithChunks(
        String(user.id),
        notes,
        prepared.chunks,
        existingNoteId || undefined
      );
      const title = notes.trim().split(/\n/)[0].slice(0, 60) || 'Quiz';
      const quizId = await saveQuiz(String(user.id), noteId, title, questions);
      onQuizGenerated(questions, { noteId, quizId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.');
      console.error('Quiz generation error:', err);
      onQuizGenerated([], { noteId: existingNoteId || 0, quizId: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tool-panel">
      <div className="section-title">
        <span className="eyebrow">Input</span>
        <h2>Generate a Quiz</h2>
      </div>
      <NoteFileUpload
        disabled={loading}
        onLoaded={({ text }) => {
          setNotes(text);
          onNotesSubmitted(text);
        }}
      />
      <Form.Group className="mb-3">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={10}
          placeholder="Paste your notes here, or upload a file above..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Form.Group>
      <Button onClick={handleGenerate} disabled={!notes || loading}>
        {loading ? 'Loading model / generating...' : 'Generate Quiz'}
      </Button>
      {provider && (
        <p className="text-muted small mt-2 mb-0">
          Generated via {provider === 'local-llm' ? 'Flan-T5 Small (on-device)' : 'TF-IDF heuristic fallback'}
        </p>
      )}
      {error && <p className="error-text mt-2">{error}</p>}
    </section>
  );
};

export default QuizGenerator;
