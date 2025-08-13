require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');
const app = express();

app.use(express.json());
app.use(session({
  secret: "your-secret",
  resave: false,
  saveUninitialized: false,
}));

// Регистрация
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await db.createUser({ username, email, password: hash });
    req.session.userId = user.id;
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Пользователь или email уже существует." });
  }
});

// Логин
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUserByUsername(username);
  if (!user) return res.status(400).json({ error: "Нет такого пользователя" });
  if (await bcrypt.compare(password, user.password)) {
    req.session.userId = user.id;
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Неверный пароль" });
  }
});

// Получить пароли пользователя
app.get('/api/entries', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Не авторизован" });
  const entries = await db.getEntries(req.session.userId);
  res.json(entries);
});

// Добавить запись
app.post('/api/entries', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Не авторизован" });
  const entry = await db.addEntry({ ...req.body, user_id: req.session.userId });
  res.json(entry);
});

// Логаут
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server started'));