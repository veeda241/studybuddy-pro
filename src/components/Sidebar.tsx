import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Bullseye, CardList, JournalText, Gear, Sun, Moon } from 'react-bootstrap-icons';

interface SidebarProps {
    toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleTheme }) => {
    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px', height: '100vh' }}>
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4">StudyBuddy Pro</span>
            </a>
            <hr />
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <NavLink to="/" className="nav-link text-white" end>
                        <House className="me-2" />
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/focus" className="nav-link text-white">
                        <Bullseye className="me-2" />
                        Focus Mode
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/quizzes" className="nav-link text-white">
                        <CardList className="me-2" />
                        Smart Quizzes
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/flashcards" className="nav-link text-white">
                        <JournalText className="me-2" />
                        Flashcards
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/settings" className="nav-link text-white">
                        <Gear className="me-2" />
                        Settings
                    </NavLink>
                </li>
            </ul>
            <hr />
            <div className="dropdown">
                <button className="btn btn-dark w-100 d-flex justify-content-center align-items-center" onClick={toggleTheme}>
                    <Sun className="me-2" /> / <Moon className="ms-2" />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;