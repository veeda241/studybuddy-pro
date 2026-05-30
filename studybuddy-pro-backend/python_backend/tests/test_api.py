import os
import json
import tempfile
import sys
import pathlib
import pytest

# Ensure package import when running tests from repository root
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from python_backend.app import create_app, init_db, get_db_path


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_file = tmp_path / 'test.db'
    app = create_app({'DATABASE': str(db_file), 'TESTING': True, 'JWT_SECRET_KEY': 'test-secret-test-secret-test-secret'})
    # Ensure DB created
    init_db(app)
    with app.test_client() as client:
        yield client


def test_register_login_and_pomodoro(client):
    # Register
    rv = client.post('/api/register', json={'username': 'alice', 'password': 'password123'})
    assert rv.status_code == 201
    data = rv.get_json()
    assert 'token' in data

    # Login
    rv = client.post('/api/login', json={'username': 'alice', 'password': 'password123'})
    assert rv.status_code == 200
    login = rv.get_json()
    assert 'token' in login
    user = login['user']

    # Pomodoro complete
    rv = client.post('/api/pomodoro/complete', json={'userId': user['id']})
    assert rv.status_code == 200
    res = rv.get_json()
    assert res['coins'] == 25


def test_summarize_flashcards_quiz_and_settings(client):
    notes = "This is sentence one. This is sentence two. Another sentence three. Sentence four here."
    rv = client.post('/api/summarize', json={'notes': notes})
    assert rv.status_code == 200
    summary = rv.get_json()['content']
    assert 'sentence one' in summary.lower()

    rv = client.post('/api/flashcards', json={'notes': notes})
    assert rv.status_code == 200
    cards = rv.get_json()
    assert isinstance(cards, list)

    rv = client.post('/api/quiz', json={'notes': notes})
    assert rv.status_code == 200
    quiz = rv.get_json()
    assert isinstance(quiz, list)

    # Settings
    rv = client.post('/api/settings/1', json={'name': 'Alice', 'studyGoals': 'Learn testing'})
    assert rv.status_code == 200
    rv = client.get('/api/settings/1')
    assert rv.status_code == 200
    s = rv.get_json()
    assert s['name'] == 'Alice'
