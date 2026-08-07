import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BoxArrowRight,
    Bullseye,
    CardList,
    ChatDots,
    Coin,
    Gear,
    House,
    JournalText,
    Moon,
    Mortarboard,
    Sun,
} from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleTheme }) => {
    const { user, logout } = useAuth();

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `sidebar-link ${isActive ? 'active' : ''}`;

    return (
        <aside className="sidebar">
            <NavLink to="/" className="brand-lockup">
                <span className="brand-icon">
                    <Mortarboard size={24} />
                </span>
                <span>
                    <strong>StudyBuddy</strong>
                    <small>Pro</small>
                </span>
            </NavLink>

            <nav className="sidebar-nav">
                <NavLink to="/" className={navLinkClass} end>
                    <House />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/focus" className={navLinkClass}>
                    <Bullseye />
                    <span>Focus Mode</span>
                </NavLink>
                <NavLink to="/quizzes" className={navLinkClass}>
                    <CardList />
                    <span>Smart Quizzes</span>
                </NavLink>
                <NavLink to="/flashcards" className={navLinkClass}>
                    <JournalText />
                    <span>Flashcards</span>
                </NavLink>
                <NavLink to="/chat" className={navLinkClass}>
                    <ChatDots />
                    <span>Doubt Chat</span>
                </NavLink>
                <NavLink to="/settings" className={navLinkClass}>
                    <Gear />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                {user && (
                    <div className="coin-balance">
                        <Coin />
                        <span>{user.coins} Coins</span>
                    </div>
                )}
                <button className="sidebar-action" onClick={toggleTheme} type="button">
                    <Sun />
                    <span>Theme</span>
                    <Moon />
                </button>
                <button className="sidebar-action danger" onClick={logout} type="button">
                    <BoxArrowRight />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
