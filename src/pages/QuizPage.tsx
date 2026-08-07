import React, { useCallback, useEffect, useState } from 'react';
import { Button, Col, Container, ListGroup, Row } from 'react-bootstrap';
import NoteSummarizer from '../components/NoteSummarizer';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';
import SavedNotesStrip from '../components/SavedNotesStrip';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  QuizQuestion,
  StudyNote,
  StudyQuiz,
  getNotesForUser,
  getQuizzesForUser,
  updateQuizScore,
} from '../lib/studyDb';

const QuizPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [notes, setNotes] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<StudyQuiz[]>([]);

  const refreshLibrary = useCallback(async () => {
    if (!user) return;
    const userId = String(user.id);
    setSavedNotes(await getNotesForUser(userId));
    setSavedQuizzes(await getQuizzesForUser(userId));
  }, [user]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  const handleSelectNote = (note: StudyNote) => {
    setNotes(note.content);
    setActiveNoteId(note.id || null);
    setQuestions([]);
    setActiveQuizId(null);
  };

  const handleQuizGenerated = async (
    nextQuestions: QuizQuestion[],
    meta: { noteId: number; quizId: number }
  ) => {
    setQuestions(nextQuestions);
    if (meta.noteId) setActiveNoteId(meta.noteId);
    if (meta.quizId) setActiveQuizId(meta.quizId);
    await refreshLibrary();
  };

  const loadQuiz = (quiz: StudyQuiz) => {
    setQuestions(quiz.questions);
    setActiveQuizId(quiz.id || null);
    setActiveNoteId(quiz.noteId);
    const note = savedNotes.find((n) => n.id === quiz.noteId);
    if (note) setNotes(note.content);
  };

  const handleQuizComplete = async (score: number, total: number) => {
    if (activeQuizId) {
      await updateQuizScore(activeQuizId, score);
      await refreshLibrary();
    }

    if (!user || total <= 0) return;
    const coins = score * 3;
    const xp = score * 8;
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
    } catch (error) {
      console.error('Failed to award quiz XP:', error);
    }
  };

  return (
    <Container fluid className="page-wrap">
      <div className="page-heading">
        <span className="eyebrow">Active recall</span>
        <h1>Smart Quizzes</h1>
        <p>Paste notes once — local RAG builds questions and a summary offline.</p>
      </div>
      <Row className="g-4 align-items-start">
        <Col lg={6}>
          <SavedNotesStrip
            notes={savedNotes}
            activeNoteId={activeNoteId}
            onSelect={handleSelectNote}
          />
          {savedQuizzes.length > 0 && (
            <div className="tool-panel mb-3">
              <div className="section-title mb-2">
                <span className="eyebrow">History</span>
                <h3 className="h6 mb-0">Saved quizzes</h3>
              </div>
              <ListGroup>
                {savedQuizzes.map((quiz) => (
                  <ListGroup.Item
                    key={quiz.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{quiz.title}</strong>
                      <div className="text-muted small">
                        {quiz.questions.length} questions
                        {quiz.bestScore != null ? ` · best ${quiz.bestScore}` : ''}
                      </div>
                    </div>
                    <Button size="sm" variant="outline-primary" onClick={() => loadQuiz(quiz)}>
                      Retry
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
          <QuizGenerator
            notes={notes}
            onNotesChange={(value) => {
              setNotes(value);
              setActiveNoteId(null);
            }}
            existingNoteId={activeNoteId}
            onQuizGenerated={handleQuizGenerated}
            onNotesSubmitted={setNotes}
          />
        </Col>
        <Col lg={6}>
          {notes && <NoteSummarizer notes={notes} />}
          {questions.length > 0 && (
            <Quiz
              key={activeQuizId || questions.map((q) => q.question).join('|')}
              questions={questions}
              onComplete={handleQuizComplete}
            />
          )}
          {!notes && questions.length === 0 && (
            <div className="empty-state">
              <strong>Your quiz preview will appear here.</strong>
              <span>Add notes to generate a summary and questions.</span>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default QuizPage;
