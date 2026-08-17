import url from 'url';
import generateAiHandler from './api/generate-ai.js';
import { supabase, mapToFrontend, mapToDb } from './api/db.js';

// Helper: parse request body with size protection
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_SIZE = 60 * 1024 * 1024; // 60MB max request size
    let received = 0;

    req.on('data', chunk => {
      received += chunk.length;
      if (received > MAX_SIZE) {
        req.destroy(new Error('Payload Too Large: Maximum allowed size is 60MB.'));
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

export function viteApiPlugin() {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Set standard security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        // Route: POST /api/generate-ai
        if (pathname === '/api/generate-ai' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            const mockRes = {
              setHeader: (k, v) => res.setHeader(k, v),
              status: (code) => { res.statusCode = code; return mockRes; },
              json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end: (data) => res.end(data)
            };
            await generateAiHandler({ method: 'POST', body }, mockRes);
          } catch (err) {
            console.error('Error generating AI content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: POST /api/content/batch
        if (pathname === '/api/content/batch' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseBody(req);
            const { items } = body;
            
            if (!Array.isArray(items)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Items must be an array' }));
              return;
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
            res.end(JSON.stringify({ success: true, items: inserted }));
          } catch (err) {
            console.error('Error batch creating content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: GET /api/notes
        if (pathname === '/api/notes' && req.method === 'GET') {
          const monthQuery = parsedUrl.query.month; // e.g. 2026-07
          res.setHeader('Content-Type', 'application/json');

          if (!monthQuery) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing month parameter' }));
            return;
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
              res.end(JSON.stringify({ month_key: monthQuery, notes: '' }));
            } else {
              res.end(JSON.stringify(data));
            }
          } catch (err) {
            console.error('Error fetching month notes in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: POST /api/notes
        if (pathname === '/api/notes' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseBody(req);
            const { month, notes } = body;

            if (!month) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing month parameter' }));
              return;
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
            res.end(JSON.stringify(data));
          } catch (err) {
            console.error('Error saving month notes in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: GET /api/content/sync
        if (pathname === '/api/content/sync' && req.method === 'GET') {
          const monthQuery = parsedUrl.query.month;
          const clientSince = parsedUrl.query.since;
          const clientCount = parsedUrl.query.count ? parseInt(parsedUrl.query.count, 10) : null;
          res.setHeader('Content-Type', 'application/json');

          try {
            let q = supabase.from('content').select('*');
            if (monthQuery) {
              q = q.like('date', `${monthQuery}%`);
            }
            q = q.order('date', { ascending: true });

            const { data, error } = await q;
            if (error) throw error;

            const items = (data || []).map(mapToFrontend);

            let latest = null;
            if (items.length > 0) {
              const timestamps = items
                .map(i => i.updatedAt ? new Date(i.updatedAt).getTime() : 0)
                .filter(t => !isNaN(t) && t > 0);
              if (timestamps.length > 0) {
                latest = new Date(Math.max(...timestamps)).toISOString();
              }
            }

            if (clientSince && clientSince === latest && (clientCount === null || clientCount === items.length)) {
              res.end(JSON.stringify({
                changed: false,
                latest,
                count: items.length
              }));
              return;
            }

            res.end(JSON.stringify({
              changed: true,
              latest,
              count: items.length,
              items
            }));
          } catch (err) {
            console.error('Error syncing content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: GET /api/content
        if (pathname === '/api/content' && req.method === 'GET') {
          const monthQuery = parsedUrl.query.month; // e.g. 2026-07
          res.setHeader('Content-Type', 'application/json');

          try {
            let q = supabase.from('content').select('*');
            if (monthQuery) {
              q = q.like('date', `${monthQuery}%`);
            }
            q = q.order('date', { ascending: true });

            const { data, error } = await q;
            if (error) throw error;

            const content = (data || []).map(mapToFrontend);
            res.end(JSON.stringify(content));
          } catch (err) {
            console.error('Error fetching content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: POST /api/content
        if (pathname === '/api/content' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseBody(req);
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

            res.end(JSON.stringify(mapToFrontend(data)));
          } catch (err) {
            console.error('Error creating content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: PUT /api/content/:id
        if (pathname.startsWith('/api/content/') && req.method === 'PUT') {
          const id = pathname.substring('/api/content/'.length);
          res.setHeader('Content-Type', 'application/json');

          try {
            const body = await parseBody(req);
            const dbRow = mapToDb(body);

            const { data, error } = await supabase
              .from('content')
              .update(dbRow)
              .eq('id', id)
              .select()
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Content not found' }));
              } else {
                throw error;
              }
            } else {
              res.end(JSON.stringify(mapToFrontend(data)));
            }
          } catch (err) {
            console.error('Error updating content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Route: DELETE /api/content/:id
        if (pathname.startsWith('/api/content/') && req.method === 'DELETE') {
          const id = pathname.substring('/api/content/'.length);
          res.setHeader('Content-Type', 'application/json');

          try {
            const { error } = await supabase
              .from('content')
              .delete()
              .eq('id', id);

            if (error) throw error;
            res.end(JSON.stringify({ success: true, id }));
          } catch (err) {
            console.error('Error deleting content in dev:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // Pass to next middleware
        next();
      });
    }
  };
}
