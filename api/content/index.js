import { supabase, mapToFrontend, mapToDb } from '../db.js';

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
      let q = supabase.from('content').select('*');
      if (monthQuery) {
        q = q.like('date', `${monthQuery}%`);
      }
      q = q.order('date', { ascending: true });

      const { data, error } = await q;
      if (error) throw error;

      const content = (data || []).map(mapToFrontend);
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

      const itemToInsert = {
        id: body.id || ('c' + Math.random().toString(36).substr(2, 9)),
        date: body.date || now.split('T')[0],
        name: body.name || 'Untitled Content',
        type: body.type || (body.category === 'written' ? 'blog' : 'static'),
        category: body.category || 'social',
        summary: body.summary || '',
        caption: body.caption || '',
        platform: body.platform || (body.category === 'written' ? 'website' : 'instagram'),
        status: body.status || 'draft',
        assets: body.assets || [],
        richText: body.richText || '',
        script: body.script || '',
        thumbnailAsset: body.thumbnailAsset || null,
        pdfAsset: body.pdfAsset || null,
        feedback: body.feedback || '',
        feedbackAssets: body.feedbackAssets || [],
        reviewedAt: body.reviewedAt || null
      };

      const dbRow = mapToDb(itemToInsert);
      const { data, error } = await supabase.from('content').insert(dbRow).select().single();
      if (error) throw error;

      return res.status(201).json(mapToFrontend(data));
    } catch (err) {
      console.error('Error creating content:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
