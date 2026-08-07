import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import FlashcardGenerator from '../components/FlashcardGenerator';
import FlashcardPlayer from '../components/FlashcardPlayer';
import NoteFileUpload from '../components/NoteFileUpload';
import SavedNotesStrip from '../components/SavedNotesStrip';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  StudyDeck,
  StudyFlashcard,
  StudyNote,
  countDueFlashcards,
  getDecksForUser,
  getDueFlashcards,
  getFlashcardsForDeck,
  getNotesForUser,
} from '../lib/studyDb';

const FlashcardsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [notes, setNotes] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<StudyFlashcard[]>([]);
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [decks, setDecks] = useState<StudyDeck[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [modeLabel, setModeLabel] = useState('Generate a deck to start reviewing.');

  const refreshLibrary = useCallback(async () => {
    if (!user) return;
    const userId = String(user.id);
    const [noteList, deckList, due] = await Promise.all([
      getNotesForUser(userId),
      getDecksForUser(userId),
      countDueFlashcards(userId),
    ]);
    setSavedNotes(noteList);
    setDecks(deckList);
    setDueCount(due);
  }, [user]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const handleSelectNote = (note: StudyNote) => {
    setNotes(note.content);
    setActiveNoteId(note.id || null);
  };

  const handleGenerated = async (
    cards: StudyFlashcard[],
    meta: { noteId: number; deckId: number }
  ) => {
    setFlashcards(cards);
    setActiveNoteId(meta.noteId);
    setModeLabel(`Reviewing new deck (#${meta.deckId})`);
    await refreshLibrary();
  };

  const loadDueCards = async () => {
    if (!user) return;
    const due = await getDueFlashcards(String(user.id));
    setFlashcards(due);
    setModeLabel(due.length ? `Reviewing ${due.length} due card(s)` : 'No cards due right now');
  };

  const loadDeck = async (deck: StudyDeck) => {
    const cards = await getFlashcardsForDeck(deck.id!);
    setFlashcards(cards);
    setActiveNoteId(deck.noteId);
    setModeLabel(`Reviewing deck: ${deck.title}`);
  };

  const awardReviewXp = async (reviewedCount: number) => {
    if (!user || reviewedCount <= 0) return;
    const coins = reviewedCount * 2;
    const xp = reviewedCount * 5;
    try {
      const response = await apiFetch('/api/user/gamification', {
        method: 'PUT',
        body: JSON.stringify({ coins, xp }),
      });
      if (response.ok) {
        const data = await response.json();
        updateUser({
          coins: data.coins ?? (user.coins || 0) + coins,
          xp: data.xp ?? (user.xp || 0) + xp,
        });
      }
      await refreshLibrary();
    } catch (error) {
      console.error('Failed to award review XP:', error);
    }
  };

  return (
    <Container fluid className="page-wrap">
      <div className="page-heading">
        <span className="eyebrow">Memory practice</span>
        <h1>Flashcards</h1>
        <p>
          Offline TF-IDF RAG builds cards from your notes. SM-2 spaced repetition schedules the next review.
        </p>
      </div>
      <Row className="g-4 align-items-start">
        <Col lg={6}>
          <SavedNotesStrip
            notes={savedNotes}
            activeNoteId={activeNoteId}
            onSelect={handleSelectNote}
          />
          <div className="tool-panel mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="eyebrow">Due today</span>
              <strong>{dueCount}</strong>
            </div>
            <div className="button-row">
              <Button onClick={loadDueCards} disabled={!dueCount}>
                Review due cards
              </Button>
            </div>
            {decks.length > 0 && (
              <ListGroup className="mt-3">
                {decks.map((deck) => (
                  <ListGroup.Item
                    key={deck.id}
                    action
                    onClick={() => loadDeck(deck)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{deck.title}</span>
                    <Button size="sm" variant="outline-secondary">
                      Open
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
          <div className="tool-panel">
            <NoteFileUpload
              onLoaded={({ text }) => {
                setNotes(text);
                setActiveNoteId(null);
              }}
            />
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                placeholder="Paste your notes here, or upload a file above..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setActiveNoteId(null);
                }}
              />
            </Form.Group>
            <FlashcardGenerator
              notes={notes}
              existingNoteId={activeNoteId}
              onFlashcardsGenerated={handleGenerated}
            />
          </div>
        </Col>
        <Col lg={6}>
          <p className="text-muted mb-2">{modeLabel}</p>
          {flashcards.length > 0 ? (
            <FlashcardPlayer
              flashcards={flashcards}
              onCardsUpdated={setFlashcards}
              onSessionComplete={awardReviewXp}
            />
          ) : (
            <div className="empty-state">
              <strong>No cards yet.</strong>
              <span>Generate a set or review due cards to begin.</span>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default FlashcardsPage;
