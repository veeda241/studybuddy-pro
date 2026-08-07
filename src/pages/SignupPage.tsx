import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Mortarboard } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        try {
            const response = await apiFetch('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username: trimmedUsername, password }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.user, data.token);
                navigate('/', { replace: true });
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Cannot reach the API. Is the backend running on port 5000?');
            console.error('Signup error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="auth-page">
            <Card className="auth-card">
                <Card.Body>
                    <div className="text-center mb-4">
                        <span className="auth-icon"><Mortarboard size={34} /></span>
                        <h1 className="mt-3">Create Account</h1>
                        <p className="text-muted">Start tracking your focus, quizzes, and flashcards.</p>
                    </div>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="username">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </Form>
                    <p className="text-center mt-3">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SignupPage;
