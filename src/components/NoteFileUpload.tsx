import React, { useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { Upload } from 'react-bootstrap-icons';
import { ACCEPTED_NOTE_TYPES, extractTextFromFile } from '../lib/fileImport';

interface NoteFileUploadProps {
  onLoaded: (payload: { text: string; title: string; fileName: string }) => void;
  disabled?: boolean;
  label?: string;
}

const NoteFileUpload: React.FC<NoteFileUploadProps> = ({
  onLoaded,
  disabled,
  label = 'Upload notes file',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLoading(true);
    setError('');
    setFileName(file.name);

    try {
      const { text, title } = await extractTextFromFile(file);
      onLoaded({ text, title, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-upload mb-3">
      <Form.Label className="d-block">{label}</Form.Label>
      <div className="button-row">
        <Button
          variant="outline-primary"
          type="button"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Reading file...
            </>
          ) : (
            <>
              <Upload className="me-2" />
              Choose file
            </>
          )}
        </Button>
        {fileName && !loading && <span className="text-muted small">{fileName}</span>}
      </div>
      <Form.Text muted>Supports .txt, .md, .csv, .json, .html, .pdf</Form.Text>
      {error && <p className="error-text mt-2 mb-0">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_NOTE_TYPES}
        className="d-none"
        onChange={handleChange}
      />
    </div>
  );
};

export default NoteFileUpload;
