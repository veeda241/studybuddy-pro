import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { apiFetch } from '../api';

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
        onQuizGenerated([]);
        onNotesSubmitted(notes);
        try {
            const response = await apiFetch('/api/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate quiz');
            }

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Add a little more detail so StudyBuddy can build questions.');
            }

            onQuizGenerated(data);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.');
            console.error('Quiz generation error:', err);
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
            <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
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
            {error && <p className="error-text mt-2">{error}</p>}
        </section>
    );
};

export default QuizGenerator;
