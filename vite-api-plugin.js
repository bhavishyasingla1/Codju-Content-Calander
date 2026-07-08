import pg from 'pg';
import url from 'url';

const connectionString = 'postgresql://postgres.nbehjvipntthyttxgutt:Codjucontentcalander%40123%24@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper: parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Mapper: db row to frontend object
function mapToFrontend(row) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    type: row.type,
    summary: row.summary || '',
    caption: row.caption || '',
    platform: row.platform || 'instagram',
    status: row.status,
    assets: row.assets || [],
    richText: row.rich_text || '',
    script: row.script || '',
    thumbnailAsset: row.thumbnail_asset || null,
    pdfAsset: row.pdf_asset || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function viteApiPlugin() {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        // Route: POST /api/generate-ai
        if (pathname === '/api/generate-ai' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseBody(req);
            const { prompt, year, month } = body;
            
            const apiKey = 'AQ.Ab8RN6JKinsY86LZmNCmGAJpa2QaRg-IfhQmIJCJpdxsNmWc0A';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
            
            const systemInstruction = `You are a professional content calendar assistant.
Analyze the user's input ideas, scripts, schedule, or notes, and generate a structured content calendar for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Catchy Title", // Keep it short and professional, no bold/italic formatting
  "type": "static" | "carousel" | "reel" | "text", // Match the most appropriate content type
  "summary": "Short description of the content piece",
  "caption": "The actual post caption to be published" // Write a complete, high-quality caption. DO NOT use any markdown asterisks like * or ** for bold. Use plain text with line breaks and emojis if suitable.
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`;

            const geminiResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                  responseMimeType: 'application/json'
                }
              })
            });
            
            if (!geminiResponse.ok) {
              const errText = await geminiResponse.text();
              throw new Error(`Gemini API error: ${errText}`);
            }
            
            const geminiData = await geminiResponse.json();
            const responseText = geminiData.candidates[0].content.parts[0].text;
            
            const items = JSON.parse(responseText.trim());
            res.end(JSON.stringify({ success: true, items }));
          } catch (err) {
            console.error('Error generating AI content:', err);
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
            
            res.end(JSON.stringify({ success: true, items: inserted }));
          } catch (err) {
            console.error('Error batch creating content:', err);
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
            let queryText = 'SELECT * FROM content';
            let params = [];

            if (monthQuery) {
              queryText += ' WHERE date LIKE $1';
              params.push(`${monthQuery}%`);
            }

            queryText += ' ORDER BY date ASC';

            const result = await pool.query(queryText, params);
            const content = result.rows.map(mapToFrontend);
            res.end(JSON.stringify(content));
          } catch (err) {
            console.error('Error fetching content:', err);
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
            res.end(JSON.stringify(mapToFrontend(result.rows[0])));
          } catch (err) {
            console.error('Error creating content:', err);
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
            const now = new Date().toISOString();

            // Dynamic SQL builder to update fields provided in the body
            const updates = [];
            const params = [];
            let paramIndex = 1;

            const fieldsMap = {
              date: 'date',
              name: 'name',
              type: 'type',
              summary: 'summary',
              caption: 'caption',
              platform: 'platform',
              status: 'status',
              assets: 'assets',
              richText: 'rich_text',
              script: 'script',
              thumbnailAsset: 'thumbnail_asset',
              pdfAsset: 'pdf_asset',
            };

            for (const [key, dbField] of Object.entries(fieldsMap)) {
              if (body[key] !== undefined) {
                updates.push(`${dbField} = $${paramIndex}`);
                if (key === 'assets' || key === 'thumbnailAsset' || key === 'pdfAsset') {
                  params.push(JSON.stringify(body[key]));
                } else {
                  params.push(body[key]);
                }
                paramIndex++;
              }
            }

            if (updates.length === 0) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'No fields to update' }));
              return;
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
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Content not found' }));
            } else {
              res.end(JSON.stringify(mapToFrontend(result.rows[0])));
            }
          } catch (err) {
            console.error('Error updating content:', err);
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
            const queryText = 'DELETE FROM content WHERE id = $1 RETURNING id';
            const result = await pool.query(queryText, [id]);

            if (result.rows.length === 0) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Content not found' }));
            } else {
              res.end(JSON.stringify({ success: true, id }));
            }
          } catch (err) {
            console.error('Error deleting content:', err);
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
