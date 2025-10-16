import React, { useState } from 'react';
import { Button, Form, ListGroup, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

const TodoList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const { user, updateUser } = useAuth();

    const addTask = () => {
        if (newTask.trim() !== '') {
            setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
            setNewTask('');
        }
    };

    const handleTaskCompletion = async (task: Task) => {
        if (!user || task.completed) return; // Don't award points for un-completing

        const coinsEarned = 10;
        const xpEarned = 20;

        try {
            await fetch('/api/user/gamification', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id, coins: coinsEarned, xp: xpEarned }),
            });
            // Update local state
            updateUser({ 
                coins: (user.coins || 0) + coinsEarned, 
                xp: (user.xp || 0) + xpEarned 
            });
        } catch (error) {
            console.error("Failed to update user stats:", error);
        }
    };

    const toggleTask = (id: number) => {
        setTasks(
            tasks.map(task => {
                if (task.id === id) {
                    const updatedTask = { ...task, completed: !task.completed };
                    if (updatedTask.completed) {
                        handleTaskCompletion(updatedTask);
                    }
                    return updatedTask;
                }
                return task;
            })
        );
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const completedTasks = tasks.filter(task => task.completed).length;
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return (
        <div>
            <h3>Task Manager</h3>
            <Form.Group className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="Enter a new task"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addTask()}
                />
            </Form.Group>
            <Button onClick={addTask} className="mb-3">Add Task</Button>
            <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
            <ListGroup>
                {tasks.map(task => (
                    <ListGroup.Item key={task.id} variant={task.completed ? 'success' : ''}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <Form.Check
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                    label={task.text}
                                />
                            </div>
                            <Button variant="danger" size="sm" onClick={() => deleteTask(task.id)}>Delete</Button>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
};

export default TodoList;
