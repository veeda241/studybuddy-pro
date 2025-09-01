import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { Bullseye, CardList, JournalText } from 'react-bootstrap-icons';

const HomePage: React.FC = () => {
    return (
        <Container fluid>
            <div className="text-center mb-4">
                <h1>StudyBuddy Pro</h1>
                <p className="lead">Smarter Learning, Better Focus</p>
            </div>
            <Row>
                <Col md={4}>
                    <Card as={Link} to="/focus" className="text-decoration-none text-dark">
                        <Card.Body className="text-center">
                            <Bullseye size={48} className="mb-3" />
                            <Card.Title>Focus Mode</Card.Title>
                            <Card.Text>
                                Your space for productivity with a Pomodoro timer and task manager.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card as={Link} to="/quizzes" className="text-decoration-none text-dark">
                        <Card.Body className="text-center">
                            <CardList size={48} className="mb-3" />
                            <Card.Title>Smart Quizzes</Card.Title>
                            <Card.Text>
                                Generate quizzes from your notes to test your knowledge.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card as={Link} to="/flashcards" className="text-decoration-none text-dark">
                        <Card.Body className="text-center">
                            <JournalText size={48} className="mb-3" />
                            <Card.Title>Flashcards</Card.Title>
                            <Card.Text>
                                Create and review flashcards to reinforce your learning.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default HomePage;