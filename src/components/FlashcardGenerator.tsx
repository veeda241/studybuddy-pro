import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { prepareNote, smartFlashcards } from '../lib/nlp/smartGenerate';
import { saveFlashcardDeck, upsertNoteWithChunks, StudyFlashcard } from '../lib/studyDb';

interface FlashcardGeneratorProps {
  notes: string;
  existingNoteId?: number | null;
  onFlashcardsGenerated: (flashcards: StudyFlashcard[], meta: { noteId: number; deckId: number }) => void;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({
  notes,
  existingNoteId,
  onFlashcardsGenerated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');

  const generate = async () => {
    if (!user) {
      setError('Please log in to save flashcards locally.');
      return;
    }

    setLoading(true);
    setError('');
    setProvider('');
    try {
      const { flashcards: cards, provider: usedProvider } = await smartFlashcards(notes);
      if (!cards.length) {
        throw new Error('Add a little more detail so StudyBuddy can build flashcards.');
      }
      setProvider(usedProvider);

      const prepared = prepareNote(notes);
      const noteId = await upsertNoteWithChunks(
        String(user.id),
        notes,
        prepared.chunks,
        existingNoteId || undefined
      );
      const title = notes.trim().split(/\n/)[0].slice(0, 60) || 'Flashcard deck';
      const { deckId, flashcards } = await saveFlashcardDeck(String(user.id), noteId, title, cards);
      onFlashcardsGenerated(flashcards, { noteId, deckId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards. Please try again.');
      console.error('Flashcard generation error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="button-row flex-column align-items-start">
      <Button onClick={generate} disabled={!notes || loading}>
        {loading ? 'Loading model / generating...' : 'Generate Flashcards from Notes'}
      </Button>
      {provider && (
        <p className="text-muted small mt-2 mb-0">
          Generated via {provider === 'local-llm' ? 'Flan-T5 Small (on-device)' : 'TF-IDF heuristic fallback'}
        </p>
      )}
      {error && <p className="error-text mt-2">{error}</p>}
    </div>
  );
};

export default FlashcardGenerator;
