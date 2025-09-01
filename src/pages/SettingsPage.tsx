import React from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

const SettingsPage: React.FC = () => {
    const resetApp = () => {
        // This would typically involve clearing local storage, resetting state, etc.
        alert('App has been reset!');
        window.location.href = '/';
    };

    return (
        <Container fluid>
            <h3>Settings</h3>
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>User Profile</Card.Title>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control type="text" placeholder="Enter your name" />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Study Goals</Form.Label>
                                    <Form.Control as="textarea" rows={3} placeholder="What are your study goals?" />
                                </Form.Group>
                            </Form>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <Card.Title>Reset Application</Card.Title>
                            <Card.Text>
                                This will reset all your tasks, quizzes, and flashcards.
                            </Card.Text>
                            <Button variant="danger" onClick={resetApp}>Reset App</Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Gamification</Card.Title>
                            <p>XP: 120</p>
                            <p>Streak: 5 days</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SettingsPage;