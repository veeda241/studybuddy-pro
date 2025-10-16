import React, { useState, useEffect } from 'react';

interface NoteSummarizerProps {
    notes: string;
}

const NoteSummarizer: React.FC<NoteSummarizerProps> = ({ notes }) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (notes.trim() === '') {
            setSummary('');
            return;
        }

        const summarize = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notes }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch summary');
                }

                const data = await response.json();
                setSummary(data.content);

            } catch (err) {
                setError('Failed to generate summary. Please try again.');
                console.error('Summarization error:', err);
            }
            setLoading(false);
        };

        const handler = setTimeout(() => {
            summarize();
        }, 1000);

        return () => {
            clearTimeout(handler);
        };
    }, [notes]);

    return (
        <div>
            <h4>Summary</h4>
            {loading && <p>Summarizing...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && <p>{summary}</p>}
        </div>
    );
};

export default NoteSummarizer;
