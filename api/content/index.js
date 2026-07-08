import { pool, mapToFrontend } from '../db.js';

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
    try {
      let queryText = 'SELECT * FROM content';
      let params = [];

      if (monthQuery) {
        queryText += ' WHERE date LIKE $1';
        params.push(`${monthQuery}%`);
      }

      queryText += ' ORDER BY date ASC';

      const result = await pool.query(queryText, params);
      const content = result.rows.map(mapToFrontend);
      return res.status(200).json(content);
    } catch (err) {
      console.error('Error fetching content:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const now = new Date().toISOString();

      const queryText = `
        INSERT INTO content (id, date, name, type, summary, caption, platform, status, assets, rich_text, script, thumbnail_asset, pdf_asset, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const params = [
        body.id || ('c' + Math.random().toString(36).substr(2, 9)),
        body.date || now.split('T')[0],
        body.name || 'Untitled Content',
        body.type || 'static',
        body.summary || '',
        body.caption || '',
        body.platform || 'instagram',
        body.status || 'draft',
        JSON.stringify(body.assets || []),
        body.richText || '',
        body.script || '',
        JSON.stringify(body.thumbnailAsset || null),
        JSON.stringify(body.pdfAsset || null),
        now,
        now
      ];

      const result = await pool.query(queryText, params);
      return res.status(200).json(mapToFrontend(result.rows[0]));
    } catch (err) {
      console.error('Error creating content:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
