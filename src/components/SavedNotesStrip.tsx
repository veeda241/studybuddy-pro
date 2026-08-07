import React from 'react';
import { Button, ListGroup } from 'react-bootstrap';
import { StudyNote } from '../lib/studyDb';

interface SavedNotesStripProps {
  notes: StudyNote[];
  activeNoteId?: number | null;
  onSelect: (note: StudyNote) => void;
  emptyLabel?: string;
}

const SavedNotesStrip: React.FC<SavedNotesStripProps> = ({
  notes,
  activeNoteId,
  onSelect,
  emptyLabel = 'No saved notes yet. Generate from pasted text to store one locally.',
}) => {
  if (!notes.length) {
    return (
      <div className="empty-state compact mb-3">
        <strong>Saved notes</strong>
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="saved-notes-strip mb-3">
      <div className="section-title mb-2">
        <span className="eyebrow">Local library</span>
        <h3 className="h6 mb-0">Saved notes</h3>
      </div>
      <ListGroup className="saved-notes-list">
        {notes.map((note) => (
          <ListGroup.Item
            key={note.id}
            className={note.id === activeNoteId ? 'active-note' : ''}
            action
            onClick={() => onSelect(note)}
          >
            <div className="d-flex justify-content-between align-items-center gap-2">
              <div>
                <strong>{note.title}</strong>
                <div className="text-muted small">
                  {new Date(note.updatedAt).toLocaleString()}
                </div>
              </div>
              <Button size="sm" variant="outline-primary">
                Open
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default SavedNotesStrip;
