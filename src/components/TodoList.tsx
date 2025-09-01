import React, { useState } from 'react';
import { Button, Form, ListGroup, ProgressBar } from 'react-bootstrap';

interface Task {
    id: number;
    text: string;
    completed: boolean;
}

const TodoList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    const addTask = () => {
        if (newTask.trim() !== '') {
            setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
            setNewTask('');
        }
    };

    const toggleTask = (id: number) => {
        setTasks(
            tasks.map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
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
