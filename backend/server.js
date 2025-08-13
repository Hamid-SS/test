require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(session({
  secret: "keepass-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure: true только для https
}));

// Регистрация
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Заполните все поля." });
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
  const { title, username, password, url } = req.body;
  if (!title || !username || !password)
    return res.status(400).json({ error: "Заполните все поля." });
  const entry = await db.addEntry({ title, username, password, url, user_id: req.session.userId });
  res.json(entry);
});

// Удалить запись
app.delete('/api/entries/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Не авторизован" });
  await db.deleteEntry(req.params.id, req.session.userId);
  res.sendStatus(204);
});

// Логаут
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Backend started on port', port));