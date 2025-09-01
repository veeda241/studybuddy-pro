import React from 'react';

interface NoteSummarizerProps {
    notes: string;
}

const NoteSummarizer: React.FC<NoteSummarizerProps> = ({ notes }) => {
    const getSummary = (text: string) => {
        const sentences = text.split('.').filter(s => s.trim() !== '');
        return sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '.' : '');
    };

    return (
        <div>
            <h4>Summary</h4>
            <p>{getSummary(notes)}</p>
        </div>
    );
};

export default NoteSummarizer;
