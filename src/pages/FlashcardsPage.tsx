import React, { useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import FlashcardGenerator from '../components/FlashcardGenerator';
import FlashcardPlayer from '../components/FlashcardPlayer';

const FlashcardsPage: React.FC = () => {
    const [notes, setNotes] = useState('');
    const [flashcards, setFlashcards] = useState<any[]>([]);

    return (
        <Container fluid className="page-wrap">
            <div className="page-heading">
                <span className="eyebrow">Memory practice</span>
                <h1>Flashcards</h1>
                <p>Create quick cards from your notes and review them one at a time.</p>
            </div>
            <Row className="g-4 align-items-start">
                <Col lg={6}>
                    <div className="tool-panel">
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={10}
                                placeholder="Paste your notes here to generate flashcards..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </Form.Group>
                        <FlashcardGenerator notes={notes} onFlashcardsGenerated={setFlashcards} />
                    </div>
                </Col>
                <Col lg={6}>
                    {flashcards.length > 0 ? (
                        <FlashcardPlayer flashcards={flashcards} onShuffle={setFlashcards} />
                    ) : (
                        <div className="empty-state">
                            <strong>No cards yet.</strong>
                            <span>Generate a set to begin reviewing.</span>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default FlashcardsPage;
