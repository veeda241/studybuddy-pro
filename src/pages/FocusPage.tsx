import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import PomodoroTimer from '../components/PomodoroTimer';
import TodoList from '../components/TodoList';

const FocusPage: React.FC = () => {
    return (
        <Container fluid className="page-wrap">
            <div className="page-heading">
                <span className="eyebrow">Deep work</span>
                <h1>Focus Mode</h1>
                <p>Plan a small set of tasks, run a sprint, and collect progress as you go.</p>
            </div>
            <Row className="g-4 align-items-start">
                <Col lg={6}>
                    <PomodoroTimer />
                </Col>
                <Col lg={6}>
                    <TodoList />
                </Col>
            </Row>
        </Container>
    );
};

export default FocusPage;
