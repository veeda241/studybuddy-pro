import React, { useState } from 'react';
import { Button, Card, ListGroup } from 'react-bootstrap';
import { QuizQuestion } from '../lib/studyDb';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);

  const handleAnswer = (option: string) => {
    const isCorrect = option === questions[currentQuestion].answer;
    const nextScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(nextScore);
    }

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowScore(true);
      onComplete?.(nextScore, questions.length);
    }
  };

  const getBadge = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return 'Gold';
    if (percentage >= 50) return 'Silver';
    return 'Bronze';
  };

  const restart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
  };

  if (showScore) {
    return (
      <section className="tool-panel result-panel">
        <span className="eyebrow">Complete</span>
        <h2>Quiz Completed</h2>
        <p>
          Your score: {score} out of {questions.length}
        </p>
        <strong>{getBadge()} Badge</strong>
        <div className="button-row mt-3">
          <Button onClick={restart}>Retry</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="quiz-panel">
      <Card>
        <Card.Body>
          <Card.Title>
            Question {currentQuestion + 1}/{questions.length}
          </Card.Title>
          <Card.Text>{questions[currentQuestion].question}</Card.Text>
          <ListGroup>
            {questions[currentQuestion].options.map((option) => (
              <ListGroup.Item key={option} action onClick={() => handleAnswer(option)}>
                {option}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </section>
  );
};

export default Quiz;
