import { supabase } from './db.js';

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
      let { data, error } = await supabase
        .from('month_notes')
        .select('*')
        .eq('month_key', monthQuery)
        .maybeSingle();

      if (error) throw error;

      if (!data && monthQuery.length > 7) {
        const baseMonth = monthQuery.substring(0, 7);
        const resBase = await supabase
          .from('month_notes')
          .select('*')
          .eq('month_key', baseMonth)
          .maybeSingle();
        data = resBase.data;
      }

      if (!data) {
        return res.status(200).json({ month_key: monthQuery, notes: '' });
      } else {
        return res.status(200).json(data);
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

      const { data, error } = await supabase
        .from('month_notes')
        .upsert(
          { month_key: month, notes: notes || '', updated_at: new Date().toISOString() },
          { onConflict: 'month_key' }
        )
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error('Error saving month notes:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
