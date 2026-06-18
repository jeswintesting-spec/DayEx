require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ─── EXPENSES ────────────────────────────────────────────────────────────────

// GET /api/expenses — fetch all with optional filters
app.get('/api/expenses', async (req, res) => {
  try {
    const { search = '', category = 'All', start = '', end = '', sort = 'date-desc' } = req.query;

    const conditions = [];
    const values = [];
    let i = 1;

    if (search) {
      conditions.push(`(LOWER(title) LIKE $${i} OR LOWER(note) LIKE $${i})`);
      values.push(`%${search.toLowerCase()}%`);
      i++;
    }
    if (category && category !== 'All') {
      conditions.push(`category = $${i}`);
      values.push(category);
      i++;
    }
    if (start) {
      conditions.push(`date >= $${i}`);
      values.push(start);
      i++;
    }
    if (end) {
      conditions.push(`date <= $${i}`);
      values.push(end);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap = {
      'date-desc':   'date DESC, created_at DESC',
      'date-asc':    'date ASC, created_at ASC',
      'amount-desc': 'amount DESC',
      'amount-asc':  'amount ASC',
    };
    const order = orderMap[sort] || 'date DESC';

    const result = await pool.query(
      `SELECT id, title, amount::float, category, date::text, note, created_at
       FROM expenses ${where} ORDER BY ${order}`,
      values
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/expenses error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses — create a new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, category, date, note } = req.body;

    if (!title || !amount || !date) {
      return res.status(400).json({ error: 'title, amount, and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (title, amount, category, date, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, amount::float, category, date::text, note, created_at`,
      [title, parseFloat(amount), category || 'Others', date, note || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/expenses error:', err.message);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id — update an expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, note } = req.body;

    const result = await pool.query(
      `UPDATE expenses
       SET title = COALESCE($1, title),
           amount = COALESCE($2, amount),
           category = COALESCE($3, category),
           date = COALESCE($4, date),
           note = COALESCE($5, note)
       WHERE id = $6
       RETURNING id, title, amount::float, category, date::text, note, created_at`,
      [title, amount ? parseFloat(amount) : null, category, date, note, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/expenses/:id error:', err.message);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id — delete a single expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ deleted: true, id });
  } catch (err) {
    console.error('DELETE /api/expenses/:id error:', err.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// DELETE /api/expenses — wipe ALL expenses (used by restore)
app.delete('/api/expenses', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses');
    res.json({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/expenses error:', err.message);
    res.status(500).json({ error: 'Failed to wipe expenses' });
  }
});

// POST /api/expenses/bulk — insert many expenses in one transaction (restore)
app.post('/api/expenses/bulk', async (req, res) => {
  const { expenses } = req.body;
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return res.status(400).json({ error: 'expenses array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const e of expenses) {
      const r = await client.query(
        `INSERT INTO expenses (title, amount, category, date, note)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, amount::float, category, date::text, note, created_at`,
        [e.title, parseFloat(e.amount), e.category || 'Others', e.date, e.note || '']
      );
      inserted.push(r.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/expenses/bulk error:', err.message);
    res.status(500).json({ error: 'Bulk insert failed, rolled back' });
  } finally {
    client.release();
  }
});

// ─── BUDGET ──────────────────────────────────────────────────────────────────

// GET /api/budget — get monthly limit
app.get('/api/budget', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, monthly_limit::float, updated_at FROM budget ORDER BY id LIMIT 1'
    );

    if (result.rows.length === 0) {
      return res.json({ id: 1, monthly_limit: 20000 });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/budget error:', err.message);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT /api/budget — update monthly limit
app.put('/api/budget', async (req, res) => {
  try {
    const { monthly_limit } = req.body;

    if (!monthly_limit || isNaN(monthly_limit)) {
      return res.status(400).json({ error: 'monthly_limit must be a valid number' });
    }

    const result = await pool.query(
      `UPDATE budget SET monthly_limit = $1, updated_at = NOW()
       WHERE id = (SELECT id FROM budget ORDER BY id LIMIT 1)
       RETURNING id, monthly_limit::float, updated_at`,
      [parseFloat(monthly_limit)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/budget error:', err.message);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 DayEx API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
