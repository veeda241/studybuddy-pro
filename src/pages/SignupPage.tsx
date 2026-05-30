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
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await apiFetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || 'Registration successful!');
                login(data.user, data.token);
                navigate('/'); // Redirect to home page or dashboard
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Network error or server is not running.');
            console.error('Signup error:', err);
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
                    {success && <Alert variant="success">{success}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="username">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Sign Up
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
