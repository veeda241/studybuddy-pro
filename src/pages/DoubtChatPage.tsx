import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import NoteFileUpload from '../components/NoteFileUpload';
import SavedNotesStrip from '../components/SavedNotesStrip';
import { useAuth } from '../context/AuthContext';
import { localLlmAnswerDoubt } from '../lib/nlp/localLlm';
import { prepareNote } from '../lib/nlp/generate';
import {
  ChatMessage,
  StudyNote,
  addChatMessage,
  clearChatMessages,
  getAllNoteTextForUser,
  getChatMessages,
  getNotesForUser,
  upsertNoteWithChunks,
} from '../lib/studyDb';

const DoubtChatPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [status, setStatus] = useState('Ask anything about your uploaded notes.');
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const userId = String(user.id);
    setSavedNotes(await getNotesForUser(userId));
    setMessages(await getChatMessages(userId));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleUpload = async (payload: { text: string; title: string; fileName: string }) => {
    if (!user) return;
    try {
      const prepared = prepareNote(payload.text);
      const noteId = await upsertNoteWithChunks(String(user.id), payload.text, prepared.chunks);
      setActiveNoteId(noteId);
      setStatus(`Loaded “${payload.fileName}” into your study library.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save uploaded notes');
    }
  };

  const handleSelectNote = (note: StudyNote) => {
    setActiveNoteId(note.id || null);
    setStatus(`Using note: ${note.title}`);
  };

  const sendMessage = async () => {
    if (!user || !input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setError('');
    setLoading(true);

    try {
      const userMsg = await addChatMessage(String(user.id), 'user', question);
      setMessages((prev) => [...prev, userMsg]);

      let corpus = '';
      if (activeNoteId) {
        const note = savedNotes.find((n) => n.id === activeNoteId);
        corpus = note?.content || '';
      }
      if (!corpus) {
        corpus = await getAllNoteTextForUser(String(user.id));
      }

      const { answer, usedContext } = await localLlmAnswerDoubt(question, corpus);
      const reply =
        usedContext.length > 0
          ? `${answer}\n\n— From your notes —\n${usedContext.map((c) => `• ${c}`).join('\n')}`
          : answer;

      const botMsg = await addChatMessage(String(user.id), 'assistant', reply);
      setMessages((prev) => [...prev, botMsg]);
      setStatus('Answered with on-device Flan-T5 + RAG over your notes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not answer that doubt');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await clearChatMessages(String(user.id));
    setMessages([]);
    setStatus('Chat cleared. Your uploaded notes are still saved.');
  };

  return (
    <Container fluid className="page-wrap">
      <div className="page-heading">
        <span className="eyebrow">Tutor</span>
        <h1>Doubt Chat</h1>
        <p>Upload notes, then ask questions. Answers use local Flan-T5 with RAG over your library.</p>
      </div>

      <Row className="g-4 align-items-start">
        <Col lg={4}>
          <div className="tool-panel mb-3">
            <NoteFileUpload onLoaded={handleUpload} label="Upload study material" />
            <p className="text-muted small mb-0">{status}</p>
          </div>
          <SavedNotesStrip
            notes={savedNotes}
            activeNoteId={activeNoteId}
            onSelect={handleSelectNote}
            emptyLabel="Upload a notes file to give the tutor context."
          />
          <Button variant="outline-secondary" size="sm" onClick={clearChat} className="mt-2">
            Clear chat
          </Button>
        </Col>

        <Col lg={8}>
          <section className="tool-panel chat-panel">
            <div className="chat-transcript">
              {messages.length === 0 && (
                <div className="empty-state compact">
                  <strong>No messages yet.</strong>
                  <span>Try: “Explain photosynthesis from my notes” or “What is osmosis?”</span>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  <span className="chat-role">{message.role === 'user' ? 'You' : 'StudyBuddy'}</span>
                  <p>{message.content}</p>
                </div>
              ))}
              {loading && (
                <div className="chat-bubble assistant">
                  <span className="chat-role">StudyBuddy</span>
                  <p>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Thinking with your notes...
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className="error-text">{error}</p>}

            <Form
              className="chat-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Ask a doubt about your notes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={!input.trim() || loading}>
                Send
              </Button>
            </Form>
          </section>
        </Col>
      </Row>
    </Container>
  );
};

export default DoubtChatPage;
