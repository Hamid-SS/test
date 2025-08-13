const { Pool } = require('pg');
const pool = new Pool();

async function createUser({ username, email, password }) {
  const res = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, password]
  );
  return res.rows[0];
}

async function findUserByUsername(username) {
  const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0];
}

async function getEntries(user_id) {
  const res = await pool.query('SELECT * FROM password_entries WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
  return res.rows;
}

async function addEntry({ title, username, password, url, user_id }) {
  const res = await pool.query(
    'INSERT INTO password_entries (title, username, password, url, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, username, password, url, user_id]
  );
  return res.rows[0];
}

async function deleteEntry(id, user_id) {
  await pool.query('DELETE FROM password_entries WHERE id = $1 AND user_id = $2', [id, user_id]);
}

module.exports = { createUser, findUserByUsername, getEntries, addEntry, deleteEntry };