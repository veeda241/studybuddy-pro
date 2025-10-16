import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

interface QuizGeneratorProps {
    onQuizGenerated: (questions: any[]) => void;
    onNotesSubmitted: (notes: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onQuizGenerated, onNotesSubmitted }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateQuiz = async () => {
        setLoading(true);
        setError('');
        onNotesSubmitted(notes);
        try {
            const response = await fetch('/api/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch quiz');
            }

            const data = await response.json();
            onQuizGenerated(data);

        } catch (err) {
            setError('Failed to generate quiz. Please try again.');
            console.error('Quiz generation error:', err);
        }
        setLoading(false);
    };

    return (
        <div>
            <Form.Group className="mb-3">
                <Form.Control
                    as="textarea"
                    rows={10}
                    placeholder="Paste your notes here..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </Form.Group>
            <Button onClick={generateQuiz} disabled={!notes || loading}>
                {loading ? 'Generating...' : 'Generate Quiz'}
            </Button>
            {error && <p style={{ color: 'red' }} className="mt-2">{error}</p>}
        </div>
    );
};

export default QuizGenerator;
