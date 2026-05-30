import React, { useState } from 'react';
import { Button, Card, ProgressBar } from 'react-bootstrap';

interface Flashcard {
    question: string;
    answer: string;
}

interface FlashcardPlayerProps {
    flashcards: Flashcard[];
    onShuffle: (flashcards: Flashcard[]) => void;
}

const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({ flashcards, onShuffle }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((currentIndex + 1) % flashcards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((currentIndex - 1 + flashcards.length) % flashcards.length);
    };

    const shuffle = () => {
        // Fisher-Yates shuffle
        const shuffled = [...flashcards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        onShuffle(shuffled);
    };

    const progress = ((currentIndex + 1) / flashcards.length) * 100;

    return (
        <section className="flashcard-panel">
            <Card onClick={() => setIsFlipped(!isFlipped)} className="flashcard">
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <Card.Text className={isFlipped ? 'flipped' : ''}>
                        {isFlipped ? flashcards[currentIndex].answer : flashcards[currentIndex].question}
                    </Card.Text>
                </Card.Body>
            </Card>
            <div className="button-row mt-3">
                <Button onClick={handlePrev}>Previous</Button>
                <Button onClick={handleNext}>Next</Button>
                <Button onClick={shuffle}>Shuffle</Button>
            </div>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mt-3" />
        </section>
    );
};

export default FlashcardPlayer;
