import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  StudyTask,
  addTask as addTaskToDb,
  deleteTask as deleteTaskFromDb,
  getTasksForUser,
  updateTask,
} from '../lib/studyDb';

const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    if (!user) return;
    getTasksForUser(String(user.id)).then(setTasks);
  }, [user]);

  const addTask = async () => {
    if (!user || newTask.trim() === '') return;
    const task = await addTaskToDb(String(user.id), newTask.trim());
    setTasks((prev) => [...prev, task]);
    setNewTask('');
  };

  const handleTaskCompletion = async () => {
    if (!user) return;

    const coinsEarned = 10;
    const xpEarned = 20;

    try {
      const response = await apiFetch('/api/user/gamification', {
        method: 'PUT',
        body: JSON.stringify({ coins: coinsEarned, xp: xpEarned }),
      });
      if (response.ok) {
        const data = await response.json();
        updateUser({
          coins: data.coins ?? (user.coins || 0) + coinsEarned,
          xp: data.xp ?? (user.xp || 0) + xpEarned,
        });
      }
    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  };

  const toggleTask = async (id: number | undefined) => {
    if (id == null) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const completed = !task.completed;
    await updateTask(id, { completed });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    if (completed) {
      await handleTaskCompletion();
    }
  };

  const deleteTask = async (id: number | undefined) => {
    if (id == null) return;
    await deleteTaskFromDb(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <section className="tool-panel">
      <div className="section-title">
        <span className="eyebrow">Tasks</span>
        <h2>Task Manager</h2>
      </div>
      <div className="task-input-row">
        <Form.Control
          type="text"
          placeholder="Enter a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <Button onClick={addTask}>Add</Button>
      </div>
      <ProgressBar now={progress} label={`${Math.round(progress)}%`} className="mb-3" />
      <ListGroup className="task-list">
        {tasks.length === 0 && (
          <div className="empty-state compact">
            <strong>No tasks yet.</strong>
            <span>Add one thing you can finish today.</span>
          </div>
        )}
        {tasks.map((task) => (
          <ListGroup.Item key={task.id} className={task.completed ? 'completed' : ''}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Form.Check
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  label={task.text}
                />
              </div>
              <Button variant="danger" size="sm" onClick={() => deleteTask(task.id)}>
                Delete
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </section>
  );
};

export default TodoList;
