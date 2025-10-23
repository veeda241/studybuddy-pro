import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [studyGoals, setStudyGoals] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            fetch(`/api/settings/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setName(data.name || user.username);
                        setStudyGoals(data.studyGoals || '');
                    }
                })
                .catch(err => console.error("Error fetching settings:", err));
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/settings/${user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, studyGoals }),
            });
            const data = await response.json();
            setMessage(data.message || 'Settings saved!');
        } catch (error) {
            setMessage('Failed to save settings.');
            console.error("Error saving settings:", error);
        }
    };

    const resetApp = () => {
        // This would typically involve clearing local storage, resetting state, etc.
        alert('App has been reset!');
        window.location.href = '/';
    };

    return (
        <Container fluid>
            <h3>Settings</h3>
            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            <Row>
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Body>
                            <Card.Title>User Profile</Card.Title>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Enter your name" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Study Goals</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        placeholder="What are your study goals?" 
                                        value={studyGoals}
                                        onChange={e => setStudyGoals(e.target.value)}
                                    />
                                </Form.Group>
                                <Button variant="primary" onClick={handleSave}>Save Settings</Button>
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