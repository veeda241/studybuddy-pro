import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const PomodoroTimer: React.FC = () => {
    const { user, updateUser } = useAuth();

    const [workDuration, setWorkDuration] = useState(() => {
        const storedWork = localStorage.getItem('pomodoroWorkDuration');
        return storedWork ? parseInt(storedWork) : 25;
    });
    const [breakDuration, setBreakDuration] = useState(() => {
        const storedBreak = localStorage.getItem('pomodoroBreakDuration');
        return storedBreak ? parseInt(storedBreak) : 5;
    });

    const [minutes, setMinutes] = useState(workDuration);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [timerType, setTimerType] = useState<'pomodoro' | 'break'>('pomodoro'); // 'pomodoro' or 'break'

    useEffect(() => {
        setMinutes(timerType === 'pomodoro' ? workDuration : breakDuration);
        setSeconds(0);
    }, [timerType, workDuration, breakDuration]);

    useEffect(() => {
        localStorage.setItem('pomodoroWorkDuration', workDuration.toString());
        localStorage.setItem('pomodoroBreakDuration', breakDuration.toString());
    }, [workDuration, breakDuration]);

    const handleSessionComplete = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/pomodoro/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
            });
            const data = await response.json();
            if (response.ok) {
                updateUser({
                    coins: data.coins,
                    xp: data.xp,
                    streak: data.streak
                });
                alert('🎉 Great job! You earned 25 coins and 50 XP.');
            }
        } catch (error) {
            console.error("Failed to update user stats:", error);
        }
    }, [user, updateUser]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setTimerType('pomodoro');
        setMinutes(workDuration);
        setSeconds(0);
    };

    const handleWorkDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setWorkDuration(value);
            if (!isActive && timerType === 'pomodoro') setMinutes(value);
        }
    };

    const handleBreakDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setBreakDuration(value);
            if (!isActive && timerType === 'break') setMinutes(value);
        }
    };

    return (
        <div className="text-center">
            <h3>Pomodoro Timer</h3>
            <div className="mb-3">
                <InputGroup className="mb-2">
                    <InputGroup.Text>Work (min)</InputGroup.Text>
                    <Form.Control
                        type="number"
                        value={workDuration}
                        onChange={handleWorkDurationChange}
                        min="1"
                        disabled={isActive}
                    />
                </InputGroup>
                <InputGroup>
                    <InputGroup.Text>Break (min)</InputGroup.Text>
                    <Form.Control
                        type="number"
                        value={breakDuration}
                        onChange={handleBreakDurationChange}
                        min="1"
                        disabled={isActive}
                    />
                </InputGroup>
            </div>
            <div style={{ fontSize: '6rem', margin: '20px 0' }}>
                {minutes < 10 ? `0${minutes}` : minutes}:{
                seconds < 10 ? `0${seconds}` : seconds}
            </div>
            <div>
                <Button onClick={toggle} variant={isActive ? 'warning' : 'primary'} className="me-2">
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={reset} variant="secondary">
                    Reset
                </Button>
            </div>
        </div>
    );
};

export default PomodoroTimer;

