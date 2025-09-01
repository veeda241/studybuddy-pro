import React, { useState } from 'react';
import { Col, Container, Form, Row } from 'react-bootstrap';
import FlashcardGenerator from '../components/FlashcardGenerator';
import FlashcardPlayer from '../components/FlashcardPlayer';

const FlashcardsPage: React.FC = () => {
    const [notes, setNotes] = useState('');
    const [flashcards, setFlashcards] = useState<any[]>([]);

    return (
        <Container fluid>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea"
                            rows={10}
                            placeholder="Paste your notes here to generate flashcards..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </Form.Group>
                    <FlashcardGenerator notes={notes} onFlashcardsGenerated={setFlashcards} />
                </Col>
                <Col md={6}>
                    {flashcards.length > 0 && <FlashcardPlayer flashcards={flashcards} onShuffle={setFlashcards} />}
                </Col>
            </Row>
        </Container>
    );
};

export default FlashcardsPage;