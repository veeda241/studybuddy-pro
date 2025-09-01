import React from 'react';
import { Button } from 'react-bootstrap';

interface FlashcardGeneratorProps {
    notes: string;
    onFlashcardsGenerated: (flashcards: any[]) => void;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({ notes, onFlashcardsGenerated }) => {
    const generateFlashcards = () => {
        const flashcards = [];
        const sentences = notes.split('.').filter(s => s.trim() !== '');
        const keywords = ['React', 'TypeScript', 'JavaScript', 'Component', 'State'];

        for (let i = 0; i < 5 && i < sentences.length; i++) {
            const sentence = sentences[i];
            const foundKeyword = keywords.find(kw => new RegExp(`\b${kw}\b`, 'i').test(sentence));
            const keyword = foundKeyword || sentence.split(' ')[0];

            flashcards.push({
                question: `What is ${keyword}?`,
                answer: sentence
            });
        }
        onFlashcardsGenerated(flashcards);
    };

    return (
        <div>
            <Button onClick={generateFlashcards} disabled={!notes}>Generate Flashcards from Notes</Button>
        </div>
    );
};

export default FlashcardGenerator;
