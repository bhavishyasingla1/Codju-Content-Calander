import { pool, mapToFrontend } from '../db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing ID parameter' });
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const now = new Date().toISOString();

      // Dynamic SQL builder to update fields provided in the body
      const updates = [];
      const params = [];
      let paramIndex = 1;

      const fieldsMap = {
        date: 'date',
        name: 'name',
        type: 'type',
        category: 'category',
        summary: 'summary',
        caption: 'caption',
        platform: 'platform',
        status: 'status',
        assets: 'assets',
        richText: 'rich_text',
        script: 'script',
        thumbnailAsset: 'thumbnail_asset',
        pdfAsset: 'pdf_asset',
        feedback: 'feedback',
        feedbackAssets: 'feedback_assets',
        reviewedAt: 'reviewed_at',
      };

      for (const [key, dbField] of Object.entries(fieldsMap)) {
        if (body[key] !== undefined) {
          updates.push(`${dbField} = $${paramIndex}`);
          if (key === 'assets' || key === 'thumbnailAsset' || key === 'pdfAsset' || key === 'feedbackAssets') {
            params.push(JSON.stringify(body[key]));
          } else {
            params.push(body[key]);
          }
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(now);
      paramIndex++;

      params.push(id);
      const queryText = `
        UPDATE content
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(queryText, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      } else {
        return res.status(200).json(mapToFrontend(result.rows[0]));
      }
    } catch (err) {
      console.error('Error updating content:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const queryText = 'DELETE FROM content WHERE id = $1 RETURNING id';
      const result = await pool.query(queryText, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      } else {
        return res.status(200).json({ success: true, id });
      }
    } catch (err) {
      console.error('Error deleting content:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
