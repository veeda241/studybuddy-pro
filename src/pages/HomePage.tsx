import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Container, Row, ProgressBar } from 'react-bootstrap';
import { Bullseye, CardList, ChatDots, JournalText, Coin, Star, Fire } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
    const { user } = useAuth();

    // Assuming XP levels are every 1000 XP
    const xpLevel = user ? Math.floor(user.xp / 1000) : 0;
    const xpForNextLevel = user ? 1000 - (user.xp % 1000) : 1000;
    const xpProgress = user ? (user.xp % 1000) / 10 : 0;

    return (
        <Container fluid className="page-wrap">
            <div className="page-hero">
                <div>
                    <span className="eyebrow">Your learning command center</span>
                    <h1>Welcome back, {user?.username || 'Buddy'}.</h1>
                    <p>Track your momentum, start a focus sprint, or turn your notes into smarter revision.</p>
                </div>
                <div className="hero-meter">
                    <span>Level</span>
                    <strong>{xpLevel}</strong>
                </div>
            </div>

            <Row className="g-3 mb-4">
                <Col md={4}>
                    <Card className="metric-card">
                        <Card.Body>
                            <span className="metric-icon warning"><Coin /></span>
                            <Card.Text>Coins Earned</Card.Text>
                            <Card.Title>{user?.coins || 0}</Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="metric-card">
                        <Card.Body>
                            <span className="metric-icon info"><Star /></span>
                            <Card.Text>Experience Points</Card.Text>
                            <Card.Title>{user?.xp || 0}</Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="metric-card">
                        <Card.Body>
                            <span className="metric-icon danger"><Fire /></span>
                            <Card.Text>Study Streak</Card.Text>
                            <Card.Title>{user?.streak || 0} Day</Card.Title>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="level-panel mb-4">
                <div>
                    <h4>Level {xpLevel}</h4>
                    <p>{xpForNextLevel} XP to next level</p>
                </div>
                <ProgressBar now={xpProgress} label={`${xpProgress}%`} />
            </div>

            <Row className="g-3">
                 <Col md={6} lg={3}>
                    <Card as={Link} to="/focus" className="feature-card">
                        <Card.Body>
                            <span className="feature-icon"><Bullseye /></span>
                            <Card.Title>Focus Mode</Card.Title>
                            <Card.Text>
                                Your space for productivity with a Pomodoro timer and task manager.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card as={Link} to="/quizzes" className="feature-card">
                        <Card.Body>
                            <span className="feature-icon"><CardList /></span>
                            <Card.Title>Smart Quizzes</Card.Title>
                            <Card.Text>
                                Upload notes or paste text, then generate quizzes on-device.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card as={Link} to="/flashcards" className="feature-card">
                        <Card.Body>
                            <span className="feature-icon"><JournalText /></span>
                            <Card.Title>Flashcards</Card.Title>
                            <Card.Text>
                                Create and review flashcards to reinforce your learning.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card as={Link} to="/chat" className="feature-card">
                        <Card.Body>
                            <span className="feature-icon"><ChatDots /></span>
                            <Card.Title>Doubt Chat</Card.Title>
                            <Card.Text>
                                Ask questions about your uploaded notes and clear doubts instantly.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default HomePage;
