import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import FocusPage from './pages/FocusPage';
import QuizPage from './pages/QuizPage';
import FlashcardsPage from './pages/FlashcardsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';

import { useAuth } from './context/AuthContext';

const App: React.FC = () => {
    const [theme, setTheme] = useState('light');
    const { isAuthenticated, isLoading } = useAuth();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        document.body.setAttribute('data-bs-theme', theme);
    }, [theme]);

    if (isLoading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>Loading...</div>;
    }

    return (
        <div className={isAuthenticated ? "d-flex" : ""}>
            {isAuthenticated && <Sidebar toggleTheme={toggleTheme} />}
            <div className={isAuthenticated ? "flex-grow-1 p-4" : ""}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/focus" element={<ProtectedRoute><FocusPage /></ProtectedRoute>} />
                    <Route path="/quizzes" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                    <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                </Routes>
            </div>
        </div>
    );
};

export default App;
