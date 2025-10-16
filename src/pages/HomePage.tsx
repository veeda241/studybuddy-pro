import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Container, Row, ProgressBar } from 'react-bootstrap';
import { Bullseye, CardList, JournalText, Coin, Star, Fire } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
    const { user } = useAuth();

    // Assuming XP levels are every 1000 XP
    const xpLevel = user ? Math.floor(user.xp / 1000) : 0;
    const xpForNextLevel = user ? 1000 - (user.xp % 1000) : 1000;
    const xpProgress = user ? (user.xp % 1000) / 10 : 0;

    return (
        <Container fluid>
            <div className="mb-4">
                <h1>Welcome, {user?.username || 'Buddy'}!</h1>
                <p className="lead">Here's your progress. Keep it up!</p>
            </div>

            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <Coin size={40} className="mb-2 text-warning" />
                            <Card.Title>{user?.coins || 0}</Card.Title>
                            <Card.Text>Coins Earned</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <Star size={40} className="mb-2 text-info" />
                            <Card.Title>{user?.xp || 0}</Card.Title>
                            <Card.Text>Experience Points</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <Fire size={40} className="mb-2 text-danger" />
                            <Card.Title>{user?.streak || 0} Day</Card.Title>
                            <Card.Text>Study Streak</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="mb-4">
                <h4>Level {xpLevel}</h4>
                <ProgressBar now={xpProgress} label={`${xpProgress}%`} />
                <p className="text-muted mt-1">{xpForNextLevel} XP to next level</p>
            </div>

            <Row>
                 <Col md={4}>
                    <Card as={Link} to="/focus" className="text-decoration-none h-100">
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
                    <Card as={Link} to="/quizzes" className="text-decoration-none h-100">
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
                    <Card as={Link} to="/flashcards" className="text-decoration-none h-100">
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