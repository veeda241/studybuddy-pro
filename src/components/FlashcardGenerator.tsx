import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

interface FlashcardGeneratorProps {
    notes: string;
    onFlashcardsGenerated: (flashcards: any[]) => void;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ notes, onFlashcardsGenerated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateFlashcards = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/flashcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch flashcards');
            }

            const data = await response.json();
            onFlashcardsGenerated(data);

        } catch (err) {
            setError('Failed to generate flashcards. Please try again.');
            console.error('Flashcard generation error:', err);
        }
        setLoading(false);
    };

    return (
        <div>
            <Button onClick={generateFlashcards} disabled={!notes || loading}>
                {loading ? 'Generating...' : 'Generate Flashcards from Notes'}
            </Button>
            {error && <p style={{ color: 'red' }} className="mt-2">{error}</p>}
        </div>
    );
};

export default FlashcardGenerator;
