import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';

const PomodoroTimer: React.FC = () => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(seconds - 1);
                } else if (minutes > 0) {
                    setMinutes(minutes - 1);
                    setSeconds(59);
                } else {
                    alert('🎉 Great job! Take a break.');
                    setIsActive(false);
                    setMinutes(5);
                    setSeconds(0);
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            if(interval) clearInterval(interval);
        }
        return () => {
            if(interval) clearInterval(interval)
        };
    }, [isActive, seconds, minutes]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setMinutes(25);
        setSeconds(0);
    };

    return (
        <div className="text-center">
            <h3>Pomodoro Timer</h3>
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
