const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const app = express();
const db = new sqlite3.Database('./notes.db');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, user_id INTEGER, content TEXT)");
});

app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views/register.html')));
app.get('/notes', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'views/notes.html'));
});

app.get('/api/notes', (req, res) => {
    if (!req.session.userId) return res.status(401).json([]);
    db.all("SELECT * FROM notes WHERE user_id = ?", [req.session.userId], (err, rows) => {
        res.json(rows);
    });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], () => {
        res.redirect('/login');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            res.redirect('/notes');
        } else {
            res.send("Login failed");
        }
    });
});

app.post('/save', (req, res) => {
  const createdAt = new Date().toISOString();
  db.run("INSERT INTO notes (user_id, content, created_at) VALUES (?, ?, ?)",
    [req.session.userId, req.body.content, createdAt], () => {
      res.redirect('/notes');
  });
});


app.post('/edit', (req, res) => {
    db.run("UPDATE notes SET content = ? WHERE id = ? AND user_id = ?", [req.body.content, req.body.id, req.session.userId], () => {
        res.redirect('/notes');
    });
});

app.post('/delete', (req, res) => {
    db.run("DELETE FROM notes WHERE id = ? AND user_id = ?", [req.body.id, req.session.userId], () => {
        res.redirect('/notes');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));