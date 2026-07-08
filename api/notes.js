import { pool } from './db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const monthQuery = req.query.month; // e.g. 2026-07
    if (!monthQuery) {
      return res.status(400).json({ error: 'Missing month parameter' });
    }

    try {
      const queryText = 'SELECT * FROM month_notes WHERE month_key = $1';
      const result = await pool.query(queryText, [monthQuery]);
      if (result.rows.length === 0) {
        return res.status(200).json({ month_key: monthQuery, notes: '' });
      } else {
        return res.status(200).json(result.rows[0]);
      }
    } catch (err) {
      console.error('Error fetching month notes:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { month, notes } = body;

      if (!month) {
        return res.status(400).json({ error: 'Missing month parameter' });
      }

      const queryText = `
        INSERT INTO month_notes (month_key, notes, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (month_key) DO UPDATE
        SET notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await pool.query(queryText, [month, notes || '']);
      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error saving month notes:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
