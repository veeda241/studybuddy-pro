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
        <div>
            <Card onClick={() => setIsFlipped(!isFlipped)} style={{ minHeight: '200px', cursor: 'pointer' }}>
                <Card.Body className="d-flex justify-content-center align-items-center">
                    <Card.Text style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.6s' }}>
                        {isFlipped ? flashcards[currentIndex].answer : flashcards[currentIndex].question}
                    </Card.Text>
                </Card.Body>
            </Card>
            <div className="mt-3">
                <Button onClick={handlePrev} className="me-2">Previous</Button>
                <Button onClick={handleNext} className="me-2">Next</Button>
                <Button onClick={shuffle}>Shuffle</Button>
            </div>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mt-3" />
        </div>
    );
};

export default FlashcardPlayer;