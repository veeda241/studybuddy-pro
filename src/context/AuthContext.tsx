import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
    id: string | number;
    username: string;
    coins: number;
    xp: number;
    streak: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toSafeUser = (newUser: User): User => ({
    id: newUser.id,
    username: newUser.username,
    coins: newUser.coins || 0,
    xp: newUser.xp || 0,
    streak: newUser.streak || 0,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (newUser: User, newToken: string) => {
        const safeUser = toSafeUser(newUser);
        // Write storage synchronously so ProtectedRoute sees the session immediately
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(safeUser));
        setToken(newToken);
        setUser(safeUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const updateUser = (updatedData: Partial<User>) => {
        setUser((current) => {
            if (!current) return current;
            const newUserData = { ...current, ...updatedData };
            localStorage.setItem('user', JSON.stringify(newUserData));
            return newUserData;
        });
    };

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
