import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

interface QuizGeneratorProps {
    onQuizGenerated: (questions: any[]) => void;
    onNotesSubmitted: (notes: string) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onQuizGenerated, onNotesSubmitted }) => {
    const [notes, setNotes] = useState('');

    const generateQuiz = () => {
        onNotesSubmitted(notes);
        const questions = [];
        const sentences = notes.split('.').filter(s => s.trim() !== '');
        const keywords = ['React', 'TypeScript', 'JavaScript', 'Component', 'State'];

        // Create a pool of sentences to be used as wrong answers
        const sentencePool = [...sentences];

        for (let i = 0; i < 5 && i < sentences.length; i++) {
            const sentence = sentences[i];
            const foundKeyword = keywords.find(kw => new RegExp(`\b${kw}\b`, 'i').test(sentence));
            const keyword = foundKeyword || sentence.split(' ')[0];
            
            const answer = sentence;

            // Remove the correct answer from the pool
            const wrongAnswerPool = sentencePool.filter(s => s !== answer);
            
            // Get 3 random wrong answers
            const wrongAnswers = wrongAnswerPool.sort(() => 0.5 - Math.random()).slice(0, 3);

            const options = [answer, ...wrongAnswers].sort(() => 0.5 - Math.random());

            if (options.length > 1) { // Only add question if there are options
                questions.push({
                    question: `What is ${keyword}?`,
                    options: options,
                    answer: answer
                });
            }
        }
        onQuizGenerated(questions);
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
            <Button onClick={generateQuiz}>Generate Quiz</Button>
        </div>
    );
};

export default QuizGenerator;
