import { supabase, mapToFrontend, mapToDb } from '../db.js';

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

    const now = new Date().toISOString();
    const rowsToInsert = items.map(item => {
      return mapToDb({
        id: item.id || ('c' + Math.random().toString(36).substr(2, 9)),
        date: item.date || now.split('T')[0],
        name: item.name || 'Untitled Content',
        type: item.type || (item.category === 'written' ? 'blog' : 'static'),
        category: item.category || 'social',
        summary: item.summary || '',
        caption: item.caption || '',
        platform: item.platform || (item.category === 'written' ? 'website' : 'instagram'),
        status: item.status || 'draft',
        assets: item.assets || [],
        richText: item.richText || (item.type === 'text' ? `<p>${item.caption || ''}</p>` : ''),
        script: item.script || ''
      });
    });

    const { data, error } = await supabase.from('content').insert(rowsToInsert).select();
    if (error) throw error;

    const inserted = (data || []).map(mapToFrontend);
    return res.status(200).json({ success: true, items: inserted });
  } catch (err) {
    console.error('Error batch creating content:', err);
    return res.status(500).json({ error: err.message });
  }
}
