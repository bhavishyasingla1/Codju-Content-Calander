import { pool, mapToFrontend } from '../db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { items } = body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const inserted = [];
    for (const item of items) {
      const now = new Date().toISOString();
      const queryText = `
        INSERT INTO content (
          id, date, name, type, summary, caption, platform, status, assets, rich_text, script, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const params = [
        item.id || ('c' + Math.random().toString(36).substr(2, 9)),
        item.date || now.split('T')[0],
        item.name || 'Untitled Content',
        item.type || 'static',
        item.summary || '',
        item.caption || '',
        item.platform || 'instagram',
        item.status || 'draft',
        JSON.stringify(item.assets || []),
        item.type === 'text' ? `<p>${item.caption || ''}</p>` : '',
        item.script || '',
        now,
        now
      ];
      const result = await pool.query(queryText, params);
      inserted.push(mapToFrontend(result.rows[0]));
    }

    return res.status(200).json({ success: true, items: inserted });
  } catch (err) {
    console.error('Error batch creating content:', err);
    return res.status(500).json({ error: err.message });
  }
}
