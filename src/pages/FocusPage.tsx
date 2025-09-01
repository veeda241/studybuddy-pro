import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import PomodoroTimer from '../components/PomodoroTimer';
import TodoList from '../components/TodoList';

const FocusPage: React.FC = () => {
    return (
        <Container fluid>
            <Row>
                <Col md={6}>
                    <PomodoroTimer />
                </Col>
                <Col md={6}>
                    <TodoList />
                </Col>
            </Row>
        </Container>
    );
};

export default FocusPage;