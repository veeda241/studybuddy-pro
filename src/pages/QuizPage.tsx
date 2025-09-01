import React, { useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import NoteSummarizer from '../components/NoteSummarizer';
import Quiz from '../components/Quiz';
import QuizGenerator from '../components/QuizGenerator';

const QuizPage: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    return (
        <Container fluid>
            <Row>
                <Col md={6}>
                    <QuizGenerator onQuizGenerated={setQuestions} onNotesSubmitted={setNotes} />
                </Col>
                <Col md={6}>
                    {notes && <NoteSummarizer notes={notes} />}
                    {questions.length > 0 && <Quiz questions={questions} />}
                </Col>
            </Row>
        </Container>
    );
};

export default QuizPage;