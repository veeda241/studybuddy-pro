const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Ensure user_settings directory exists
const settingsDir = path.join(__dirname, 'user_settings');
if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir);
}
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- CONFIGURATIONS ---
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- DATABASE INITIALIZATION ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        return console.error('Error connecting to database:', err.message);
    }
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT,
        coins INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        lastCompletedDate TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');
        }
    });
});

// --- AUTHENTICATION ROUTES ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, coins, xp, streak) VALUES (?, ?, 0, 0, 0)';
        db.run(sql, [username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ message: 'User already exists' });
                }
                return res.status(500).json({ message: 'Server error during registration' });
            }
            const userId = this.lastID;
            const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '1h' });
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                 if (err || !user) return res.status(500).json({ message: 'Error fetching new user' });
                 res.status(201).json({ message: 'User registered', token, user });
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], async (err, user) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Logged in successfully', token, user });
    });
});

app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const username = payload.name;

        db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
            if (err) {
                return res.status(500).json({ message: "Server error finding user." });
            }

            if (user) {
                // User exists, log them in
                const jwtToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({ message: 'Logged in successfully', token: jwtToken, user });
            } else {
                // User does not exist, create a new one
                const sql = 'INSERT INTO users (username, coins, xp, streak) VALUES (?, 0, 0, 0)';
                db.run(sql, [username], function(err) {
                    if (err) {
                        return res.status(500).json({ message: "Server error creating user." });
                    }
                    const userId = this.lastID;
                    const jwtToken = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '1h' });
                    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, newUser) => {
                        if (err || !newUser) {
                            return res.status(500).json({ message: "Error fetching new user." });
                        }
                        res.status(201).json({ message: 'User created and logged in', token: jwtToken, user: newUser });
                    });
                });
            }
        });
    } catch (error) {
        res.status(400).json({ message: 'Invalid Google token.' });
    }
});

// --- GAMIFICATION ROUTES ---

app.put('/api/user/gamification', (req, res) => {
    const { userId, coins, xp } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const sql = `UPDATE users SET coins = coins + ?, xp = xp + ? WHERE id = ?`;
    db.run(sql, [coins || 0, xp || 0, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ message: 'User stats updated' });
    });
});

app.post('/api/pomodoro/complete', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const sql = 'SELECT streak, lastCompletedDate FROM users WHERE id = ?';
    db.get(sql, [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ message: 'User not found' });

        const today = new Date().toISOString().slice(0, 10);
        let newStreak = user.streak || 0;

        if (user.lastCompletedDate) {
            const lastDate = new Date(user.lastCompletedDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10)) {
                newStreak++;
            } else if (user.lastCompletedDate !== today) {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        const updateSql = 'UPDATE users SET coins = coins + 25, xp = xp + 50, streak = ?, lastCompletedDate = ? WHERE id = ?';
        db.run(updateSql, [newStreak, today, userId], function(err) {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.status(200).json({ message: 'Pomodoro completed!', coins: 25, xp: 50, streak: newStreak });
        });
    });
});

// --- "SMARTER" OFFLINE CONTENT GENERATION ---

const stopWords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);

const getKeywords = (text, count = 5) => {
    const words = text.toLowerCase().replace(/[^a-zA-Z\s]/g, '').split(/\s+/);
    const freq = {};
    for (const word of words) {
        if (word && !stopWords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }
    return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, count);
};

app.post('/api/summarize', (req, res) => {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ message: 'Notes are required' });
    const sentences = notes.match(/[^.!?]+[.!?]+/g) || [];
    const summary = sentences.slice(0, 2).join(' ');
    res.status(200).json({ content: summary });
});

app.post('/api/flashcards', (req, res) => {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ message: 'Notes are required' });

    const sentences = notes.match(/[^.!?]+[.!?]+/g) || [];
    const keywords = getKeywords(notes, sentences.length);
    const flashcards = [];

    for (const keyword of keywords) {
        const sentence = sentences.find(s => s.toLowerCase().includes(keyword));
        if (sentence) {
            flashcards.push({ question: `What is the significance of "${keyword}"?`, answer: sentence.trim() });
        }
    }
    res.status(200).json(flashcards.slice(0, 10)); // Limit to 10 flashcards
});

app.post('/api/quiz', (req, res) => {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ message: 'Notes are required' });

    const sentences = notes.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 4) {
        return res.status(400).json({ message: 'Not enough content to generate a quiz. Please provide at least 4 sentences.' });
    }

    const keywords = getKeywords(notes, sentences.length);
    const questions = [];

    for (let i = 0; i < Math.min(keywords.length, 5); i++) {
        const keyword = keywords[i];
        const answerSentence = sentences.find(s => s.toLowerCase().includes(keyword));
        if (!answerSentence) continue;

        const otherSentences = sentences.filter(s => s !== answerSentence);
        const wrongOptions = otherSentences.sort(() => 0.5 - Math.random()).slice(0, 3).map(s => s.trim());
        
        if (wrongOptions.length < 3) continue;

        const options = [answerSentence.trim(), ...wrongOptions].sort(() => 0.5 - Math.random());

        questions.push({
            question: `Which statement is true regarding "${keyword}"?`,
            options: options,
            answer: answerSentence.trim()
        });
    }
    res.status(200).json(questions);
    });
});

// --- USER SETTINGS ROUTES (JSON file-based) ---

app.get('/api/settings/:userId', (req, res) => {
    const { userId } = req.params;
    const settingsPath = path.join(settingsDir, `${userId}.json`);

    if (fs.existsSync(settingsPath)) {
        fs.readFile(settingsPath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading settings.' });
            }
            res.status(200).json(JSON.parse(data));
        });
    } else {
        // Return default/empty settings if file doesn't exist
        res.status(200).json({ name: '', studyGoals: '' });
    }
});

app.post('/api/settings/:userId', (req, res) => {
    const { userId } = req.params;
    const settingsPath = path.join(settingsDir, `${userId}.json`);
    const settingsData = JSON.stringify(req.body, null, 2);

    fs.writeFile(settingsPath, settingsData, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving settings.' });
        }
        res.status(200).json({ message: 'Settings saved successfully.' });
    });
});


// --- SERVER STARTUP ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    });
});

module.exports = app;
