import React, { useState } from 'react';
import { Card, ListGroup } from 'react-bootstrap';

interface Question {
    question: string;
    options: string[];
    answer: string;
}

interface QuizProps {
    questions: Question[];
}

const Quiz: React.FC<QuizProps> = ({ questions }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    const handleAnswer = (option: string) => {
        if (option === questions[currentQuestion].answer) {
            setScore(score + 1);
        }

        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < questions.length) {
            setCurrentQuestion(nextQuestion);
        } else {
            setShowScore(true);
        }
    };

    const getBadge = () => {
        const percentage = (score / questions.length) * 100;
        if (percentage >= 80) return '🥇 Gold';
        if (percentage >= 50) return '🥈 Silver';
        return '🥉 Bronze';
    };

    if (showScore) {
        return (
            <div>
                <h3>Quiz Completed!</h3>
                <p>Your score: {score} out of {questions.length}</p>
                <p>Badge: {getBadge()}</p>
            </div>
        );
    }

    return (
        <div>
            <Card>
                <Card.Body>
                    <Card.Title>Question {currentQuestion + 1}/{questions.length}</Card.Title>
                    <Card.Text>{questions[currentQuestion].question}</Card.Text>
                    <ListGroup>
                        {questions[currentQuestion].options.map(option => (
                            <ListGroup.Item key={option} action onClick={() => handleAnswer(option)}>
                                {option}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Quiz;
