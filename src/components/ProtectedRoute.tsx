import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="loading-card">
                    <div className="loading-mark" />
                    <span>Loading your workspace...</span>
                </div>
            </div>
        );
    }

    // localStorage is written synchronously on login, so this covers the
    // navigate-before-React-state-flush race after register/login.
    const hasStoredSession =
        !!localStorage.getItem('token') && !!localStorage.getItem('user');

    if (!isAuthenticated && !hasStoredSession) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
