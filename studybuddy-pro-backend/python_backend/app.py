import os
import sqlite3
import json
import re
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

STOP_WORDS = set(['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now'])

def get_keywords(text, count=5):
    words = re.sub(r'[^a-zA-Z\s]', '', text.lower()).split()
    freq = {}
    for w in words:
        if w and w not in STOP_WORDS:
            freq[w] = freq.get(w, 0) + 1
    return sorted(freq.keys(), key=lambda k: freq[k], reverse=True)[:count]

def split_notes(notes):
    chunks = []
    for line in re.split(r'\r?\n+', notes or ''):
        for part in re.split(r'(?<=[.!?])\s+', line):
            cleaned = re.sub(r'^\s*[-*•\d.)]+\s*', '', part).strip()
            if cleaned:
                chunks.append(cleaned)
    if len(chunks) > 1:
        return chunks
    return [
        re.sub(r'^\s*[-*•\d.)]+\s*', '', part).strip()
        for part in re.split(r'[.!?;]+|,(?=\s+[A-Z])', notes or '')
        if re.sub(r'^\s*[-*•\d.)]+\s*', '', part).strip()
    ]

def make_keyword_options(keywords, answer):
    fallback = ['definition', 'example', 'timeline', 'formula', 'contrast', 'summary']
    options = []
    for option in [answer] + [kw for kw in keywords if kw != answer] + fallback:
        if option and option not in options:
            options.append(option)
        if len(options) == 4:
            break
    import random
    random.shuffle(options)
    return options

def get_db_path(app):
    default_db_path = os.path.join(os.path.dirname(__file__), 'python_backend.db')
    return app.config.get('DATABASE') or os.getenv('DATABASE') or default_db_path

def init_db(app):
    db_path = get_db_path(app)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT,
        coins INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        lastCompletedDate TEXT
    )''')
    conn.commit()
    conn.close()

def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'supersecretjwtkey-supersecretjwtkey')
    app.config['DATABASE'] = os.getenv('DATABASE', os.path.join(os.path.dirname(__file__), 'python_backend.db'))
    if config_overrides:
        app.config.update(config_overrides)

    @app.route('/', methods=['GET'])
    def home():
        return jsonify({
            'message': 'StudyBuddy Pro backend is running',
            'routes': [
                '/api/register',
                '/api/login',
                '/api/pomodoro/complete',
                '/api/summarize',
                '/api/flashcards',
                '/api/quiz',
                '/api/settings/<user_id>'
            ]
        }), 200

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok'}), 200

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = os.getenv('CORS_ORIGIN', '*')
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
        return response

    @app.route('/api/<path:_path>', methods=['OPTIONS'])
    def handle_options(_path):
        return jsonify({}), 204

    jwt = JWTManager(app)

    init_db(app)

    # Routes
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'message': 'Please enter all fields'}), 400

        db_path = get_db_path(app)
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        try:
            hashed = generate_password_hash(password)
            cur.execute('INSERT INTO users (username, password, coins, xp, streak) VALUES (?, ?, 0, 0, 0)', (username, hashed))
            conn.commit()
            user_id = cur.lastrowid
            cur.execute('SELECT id, username, coins, xp, streak, lastCompletedDate FROM users WHERE id = ?', (user_id,))
            row = cur.fetchone()
            token = create_access_token(identity={'id': row[0], 'username': row[1]}, expires_delta=timedelta(hours=1))
            user = dict(id=row[0], username=row[1], coins=row[2], xp=row[3], streak=row[4], lastCompletedDate=row[5])
            return jsonify({'message': 'User registered', 'token': token, 'user': user}), 201
        except sqlite3.IntegrityError:
            return jsonify({'message': 'User already exists'}), 400
        finally:
            conn.close()

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'message': 'Please enter all fields'}), 400
        db_path = get_db_path(app)
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute('SELECT id, username, password, coins, xp, streak, lastCompletedDate FROM users WHERE username = ?', (username,))
        row = cur.fetchone()
        conn.close()
        if not row or not row[2]:
            return jsonify({'message': 'Invalid credentials'}), 400
        if not check_password_hash(row[2], password):
            return jsonify({'message': 'Invalid credentials'}), 400
        token = create_access_token(identity={'id': row[0], 'username': row[1]}, expires_delta=timedelta(hours=1))
        user = dict(id=row[0], username=row[1], coins=row[3], xp=row[4], streak=row[5], lastCompletedDate=row[6])
        return jsonify({'message': 'Logged in successfully', 'token': token, 'user': user}), 200

    @app.route('/api/pomodoro/complete', methods=['POST'])
    def pomodoro_complete():
        data = request.get_json() or {}
        user_id = data.get('userId')
        if not user_id:
            return jsonify({'message': 'User ID is required'}), 400
        db_path = get_db_path(app)
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute('SELECT streak, lastCompletedDate FROM users WHERE id = ?', (user_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return jsonify({'message': 'User not found'}), 500
        streak, last_date = row[0] or 0, row[1]
        today = datetime.utcnow().strftime('%Y-%m-%d')
        new_streak = streak
        if last_date:
            last_dt = datetime.strptime(last_date, '%Y-%m-%d')
            yesterday = datetime.utcnow() - timedelta(days=1)
            if last_dt.strftime('%Y-%m-%d') == yesterday.strftime('%Y-%m-%d'):
                new_streak += 1
            elif last_date != today:
                new_streak = 1
        else:
            new_streak = 1
        cur.execute('UPDATE users SET coins = coins + 25, xp = xp + 50, streak = ?, lastCompletedDate = ? WHERE id = ?', (new_streak, today, user_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Pomodoro completed!', 'coins': 25, 'xp': 50, 'streak': new_streak}), 200

    @app.route('/api/summarize', methods=['POST'])
    def summarize():
        data = request.get_json() or {}
        notes = data.get('notes')
        if not notes:
            return jsonify({'message': 'Notes are required'}), 400
        sentences = split_notes(notes)
        summary = ' '.join(sentences[:2])
        return jsonify({'content': summary}), 200

    @app.route('/api/flashcards', methods=['POST'])
    def flashcards():
        data = request.get_json() or {}
        notes = data.get('notes')
        if not notes:
            return jsonify({'message': 'Notes are required'}), 400
        sentences = split_notes(notes)
        keywords = get_keywords(notes, max(len(sentences), 5))
        cards = []
        for kw in keywords:
            s = next((s for s in sentences if kw in s.lower()), None)
            if s:
                cards.append({'question': f'What is the significance of "{kw}"?', 'answer': s.strip()})
        return jsonify(cards[:10]), 200

    @app.route('/api/quiz', methods=['POST'])
    def quiz():
        data = request.get_json() or {}
        notes = data.get('notes')
        if not notes:
            return jsonify({'message': 'Notes are required'}), 400
        sentences = split_notes(notes)
        keywords = get_keywords(notes, max(len(sentences), 6))
        if not sentences or not keywords:
            return jsonify({'message': 'Add a little more detail so StudyBuddy can build questions.'}), 400
        questions = []
        import random
        for kw in keywords[:5]:
            answer_sentence = next((s for s in sentences if kw in s.lower()), None)
            if not answer_sentence:
                continue
            other = [s for s in sentences if s != answer_sentence]
            wrong = random.sample(other, min(3, len(other)))
            if len(wrong) < 3:
                questions.append({
                    'question': f'Which key term is connected to this note: "{answer_sentence.strip()}"?',
                    'options': make_keyword_options(keywords, kw),
                    'answer': kw
                })
                continue
            options = [answer_sentence.strip()] + [w.strip() for w in wrong]
            random.shuffle(options)
            questions.append({'question': f'Which statement is true regarding "{kw}"?', 'options': options, 'answer': answer_sentence.strip()})
        if not questions:
            return jsonify({'message': 'Add a little more detail so StudyBuddy can build questions.'}), 400
        return jsonify(questions), 200

    # Settings routes (JSON file per user)
    settings_dir = os.path.join(os.path.dirname(__file__), 'user_settings')
    os.makedirs(settings_dir, exist_ok=True)

    @app.route('/api/settings/<user_id>', methods=['GET'])
    def get_settings(user_id):
        settings_path = os.path.join(settings_dir, f'{user_id}.json')
        if os.path.exists(settings_path):
            with open(settings_path, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f)), 200
        return jsonify({'name': '', 'studyGoals': ''}), 200

    @app.route('/api/settings/<user_id>', methods=['POST'])
    def save_settings(user_id):
        settings_path = os.path.join(settings_dir, f'{user_id}.json')
        with open(settings_path, 'w', encoding='utf-8') as f:
            json.dump(request.get_json() or {}, f, indent=2)
        return jsonify({'message': 'Settings saved successfully.'}), 200

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
