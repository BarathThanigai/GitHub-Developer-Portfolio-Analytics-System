require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'DBMS_PROJECT',
  waitForConnections: true,
  connectionLimit: 10,
});


function adminError(res, err) {
  console.error('Admin error:', err.message);
  res.status(500).json({ error: err.message });
}

// USER
app.get('/api/admin/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `user` ORDER BY user_id DESC');
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/users', async (req, res) => {
  const { user_id, username, email, state, country, followers_count } = req.body;
  try {
    await pool.query(
      'INSERT INTO `user` (user_id, username, email, state, country, followers_count) VALUES (?,?,?,?,?,?)',
      [user_id, username, email, state || null, country || null, followers_count || 0]
    );
    res.json({ success: true, user_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/users/:id', async (req, res) => {
  const { username, email, state, country, followers_count } = req.body;
  try {
    await pool.query(
      'UPDATE `user` SET username=?, email=?, state=?, country=?, followers_count=? WHERE user_id=?',
      [username, email, state || null, country || null, followers_count || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM `user` WHERE user_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// REPOSITORY
app.get('/api/admin/repositories', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username AS owner_name
      FROM repository r
      LEFT JOIN \`user\` u ON r.user_id = u.user_id
      ORDER BY r.repo_id DESC
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/repositories', async (req, res) => {
  const { repo_id, repo_name, visibility, user_id, parent_repo_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO repository (repo_id, repo_name, visibility, user_id, parent_repo_id) VALUES (?,?,?,?,?)',
      [repo_id, repo_name, visibility || 'private', user_id, parent_repo_id || null]
    );
    res.json({ success: true, repo_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/repositories/:id', async (req, res) => {
  const { repo_name, visibility, user_id, parent_repo_id } = req.body;
  try {
    await pool.query(
      'UPDATE repository SET repo_name=?, visibility=?, user_id=?, parent_repo_id=? WHERE repo_id=?',
      [repo_name, visibility, user_id, parent_repo_id || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/repositories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM repository WHERE repo_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// COMMIT_TABLE
app.get('/api/admin/commits', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ct.*, u.username, r.repo_name
      FROM commit_table ct
      LEFT JOIN \`user\` u ON ct.user_id = u.user_id
      LEFT JOIN repository r ON ct.repo_id = r.repo_id
      ORDER BY ct.commit_time DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/commits', async (req, res) => {
  const { commit_id, commit_message, commit_time, lines_added, lines_deleted, repo_id, user_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO commit_table (commit_id, commit_message, commit_time, lines_added, lines_deleted, repo_id, user_id) VALUES (?,?,?,?,?,?,?)',
      [commit_id, commit_message, commit_time || new Date(), lines_added || 0, lines_deleted || 0, repo_id, user_id]
    );
    res.json({ success: true, commit_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/commits/:id', async (req, res) => {
  const { commit_message, commit_time, lines_added, lines_deleted, repo_id, user_id } = req.body;
  try {
    await pool.query(
      'UPDATE commit_table SET commit_message=?, commit_time=?, lines_added=?, lines_deleted=?, repo_id=?, user_id=? WHERE commit_id=?',
      [commit_message, commit_time || new Date(), lines_added || 0, lines_deleted || 0, repo_id, user_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/commits/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM commit_table WHERE commit_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// PROGRAMMING_LANGUAGE
app.get('/api/admin/languages', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM programming_language ORDER BY language_id ASC');
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/languages', async (req, res) => {
  const { language_id, language_name } = req.body;
  try {
    await pool.query(
      'INSERT INTO programming_language (language_id, language_name) VALUES (?,?)',
      [language_id, language_name]
    );
    res.json({ success: true, language_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/languages/:id', async (req, res) => {
  const { language_name } = req.body;
  try {
    await pool.query(
      'UPDATE programming_language SET language_name=? WHERE language_id=?',
      [language_name, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/languages/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM programming_language WHERE language_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// REPOSITORY_LANGUAGE
app.get('/api/admin/repo-languages', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rl.*, r.repo_name, pl.language_name
      FROM repository_language rl
      JOIN repository r ON rl.repo_id = r.repo_id
      JOIN programming_language pl ON rl.language_id = pl.language_id
      ORDER BY rl.repo_id DESC
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/repo-languages', async (req, res) => {
  const { repo_id, language_id, usage_percentage } = req.body;
  try {
    await pool.query(
      'INSERT INTO repository_language (repo_id, language_id, usage_percentage) VALUES (?,?,?)',
      [repo_id, language_id, usage_percentage]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/repo-languages/:repo_id/:lang_id', async (req, res) => {
  const { usage_percentage } = req.body;
  try {
    await pool.query(
      'UPDATE repository_language SET usage_percentage=? WHERE repo_id=? AND language_id=?',
      [usage_percentage, req.params.repo_id, req.params.lang_id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/repo-languages/:repo_id/:lang_id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM repository_language WHERE repo_id=? AND language_id=?',
      [req.params.repo_id, req.params.lang_id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// PULL_REQUEST
app.get('/api/admin/pull-requests', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pr.*, r.repo_name, u.username
      FROM pull_request pr
      LEFT JOIN repository r ON pr.repo_id = r.repo_id
      LEFT JOIN \`user\` u ON pr.user_id = u.user_id
      ORDER BY pr.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/pull-requests', async (req, res) => {
  const { pr_id, repo_id, status, user_id, merged_at, closed_at } = req.body;
  try {
    await pool.query(
      'INSERT INTO pull_request (pr_id, repo_id, status, user_id, merged_at, closed_at) VALUES (?,?,?,?,?,?)',
      [pr_id, repo_id, status || 'open', user_id, merged_at || null, closed_at || null]
    );
    res.json({ success: true, pr_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/pull-requests/:id', async (req, res) => {
  const { repo_id, status, user_id, merged_at, closed_at } = req.body;
  try {
    await pool.query(
      'UPDATE pull_request SET repo_id=?, status=?, user_id=?, merged_at=?, closed_at=? WHERE pr_id=?',
      [repo_id, status, user_id, merged_at || null, closed_at || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/pull-requests/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM pull_request WHERE pr_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// ISSUE
app.get('/api/admin/issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, r.repo_name, u.username
      FROM issue i
      LEFT JOIN repository r ON i.repo_id = r.repo_id
      LEFT JOIN \`user\` u ON i.user_id = u.user_id
      ORDER BY i.created_at DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/issues', async (req, res) => {
  const { issue_id, repo_id, title, status, user_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO issue (issue_id, repo_id, title, status, user_id) VALUES (?,?,?,?,?)',
      [issue_id, repo_id, title, status || 'open', user_id]
    );
    res.json({ success: true, issue_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/issues/:id', async (req, res) => {
  const { repo_id, title, status, user_id } = req.body;
  try {
    await pool.query(
      'UPDATE issue SET repo_id=?, title=?, status=?, user_id=? WHERE issue_id=?',
      [repo_id, title, status, user_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/issues/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM issue WHERE issue_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// REPOSITORY_STAT
app.get('/api/admin/repo-stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rs.*, r.repo_name
      FROM repository_stat rs
      JOIN repository r ON rs.repo_id = r.repo_id
      ORDER BY rs.repo_id DESC
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/repo-stats', async (req, res) => {
  const { repo_id, stars_count, forks_count } = req.body;
  try {
    await pool.query(
      'INSERT INTO repository_stat (repo_id, stars_count, forks_count) VALUES (?,?,?)',
      [repo_id, stars_count || 0, forks_count || 0]
    );
    res.json({ success: true, repo_id });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/repo-stats/:id', async (req, res) => {
  const { stars_count, forks_count } = req.body;
  try {
    await pool.query(
      'UPDATE repository_stat SET stars_count=?, forks_count=? WHERE repo_id=?',
      [stars_count || 0, forks_count || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/repo-stats/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM repository_stat WHERE repo_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

// COLLABORATOR
app.get('/api/admin/collaborators', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.username, r.repo_name
      FROM collaborator c
      JOIN \`user\` u ON c.user_id = u.user_id
      JOIN repository r ON c.repo_id = r.repo_id
      ORDER BY c.repo_id DESC
    `);
    res.json(rows);
  } catch (err) { adminError(res, err); }
});

app.post('/api/admin/collaborators', async (req, res) => {
  const { user_id, repo_id, lines_added, lines_deleted } = req.body;
  try {
    await pool.query(
      'INSERT INTO collaborator (user_id, repo_id, lines_added, lines_deleted) VALUES (?,?,?,?)',
      [user_id, repo_id, lines_added || 0, lines_deleted || 0]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.put('/api/admin/collaborators/:user_id/:repo_id', async (req, res) => {
  const { lines_added, lines_deleted } = req.body;
  try {
    await pool.query(
      'UPDATE collaborator SET lines_added=?, lines_deleted=? WHERE user_id=? AND repo_id=?',
      [lines_added || 0, lines_deleted || 0, req.params.user_id, req.params.repo_id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

app.delete('/api/admin/collaborators/:user_id/:repo_id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM collaborator WHERE user_id=? AND repo_id=?',
      [req.params.user_id, req.params.repo_id]
    );
    res.json({ success: true });
  } catch (err) { adminError(res, err); }
});

//Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`\nDevMatch Admin API running on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'DBMS_PROJECT'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Verify DB connection on startup
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful\n');
  } catch (err) {
    console.error('Database connection failed:', err.message, '\n');
  }
});