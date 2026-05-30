import React, { useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import NoteSummarizer from '../components/NoteSummarizer';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';

const QuizPage: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    return (
        <Container fluid className="page-wrap">
            <div className="page-heading">
                <span className="eyebrow">Active recall</span>
                <h1>Smart Quizzes</h1>
                <p>Paste notes once, then generate questions and a quick summary for review.</p>
            </div>
            <Row className="g-4 align-items-start">
                <Col lg={6}>
                    <QuizGenerator onQuizGenerated={setQuestions} onNotesSubmitted={setNotes} />
                </Col>
                <Col lg={6}>
                    {notes && <NoteSummarizer notes={notes} />}
                    {questions.length > 0 && <Quiz questions={questions} />}
                    {!notes && questions.length === 0 && (
                        <div className="empty-state">
                            <strong>Your quiz preview will appear here.</strong>
                            <span>Add notes to generate a summary and questions.</span>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default QuizPage;
