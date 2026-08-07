import React, { useEffect, useState } from 'react';
import { Button, Card, ProgressBar } from 'react-bootstrap';
import { StudyFlashcard, updateFlashcardReview } from '../lib/studyDb';
import { ReviewRating, reviewWithRating } from '../lib/spacedRepetition';

interface FlashcardPlayerProps {
  flashcards: StudyFlashcard[];
  onCardsUpdated?: (flashcards: StudyFlashcard[]) => void;
  onSessionComplete?: (reviewedCount: number) => void;
}

const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  flashcards,
  onCardsUpdated,
  onSessionComplete,
}) => {
  const [queue, setQueue] = useState<StudyFlashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    setQueue(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCount(0);
    setSessionDone(false);
  }, [flashcards]);

  if (!queue.length) {
    return (
      <div className="empty-state">
        <strong>No cards in this session.</strong>
        <span>Generate a deck or load due cards to begin.</span>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <section className="tool-panel result-panel">
        <span className="eyebrow">Spaced repetition</span>
        <h2>Review complete</h2>
        <p>You reviewed {reviewedCount} card{reviewedCount === 1 ? '' : 's'}. Intervals updated with SM-2.</p>
      </section>
    );
  }

  const current = queue[currentIndex];
  const progress = ((reviewedCount) / queue.length) * 100;

  const handleRating = async (rating: ReviewRating) => {
    if (!current.id) return;

    const nextState = reviewWithRating(
      {
        ease: current.ease,
        interval: current.interval,
        repetitions: current.repetitions,
      },
      rating
    );

    await updateFlashcardReview(current.id, nextState);

    const updatedCard: StudyFlashcard = { ...current, ...nextState };
    const updatedQueue = queue.map((card) => (card.id === current.id ? updatedCard : card));
    setQueue(updatedQueue);
    onCardsUpdated?.(updatedQueue);

    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);
    setIsFlipped(false);

    if (currentIndex + 1 >= queue.length) {
      setSessionDone(true);
      onSessionComplete?.(nextReviewed);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <section className="flashcard-panel">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="eyebrow">Card {currentIndex + 1} / {queue.length}</span>
        <span className="text-muted small">
          Ease {current.ease.toFixed(2)} · Interval {current.interval}d
        </span>
      </div>
      <Card onClick={() => setIsFlipped(!isFlipped)} className="flashcard">
        <Card.Body className="d-flex justify-content-center align-items-center">
          <Card.Text className={isFlipped ? 'flipped' : ''}>
            {isFlipped ? current.answer : current.question}
          </Card.Text>
        </Card.Body>
      </Card>
      {!isFlipped ? (
        <div className="button-row mt-3">
          <Button onClick={() => setIsFlipped(true)}>Show answer</Button>
        </div>
      ) : (
        <div className="button-row rating-row mt-3">
          <Button variant="danger" onClick={() => handleRating('again')}>Again</Button>
          <Button variant="warning" onClick={() => handleRating('hard')}>Hard</Button>
          <Button variant="success" onClick={() => handleRating('good')}>Good</Button>
          <Button variant="primary" onClick={() => handleRating('easy')}>Easy</Button>
        </div>
      )}
      <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mt-3" />
    </section>
  );
};

export default FlashcardPlayer;
