import pg from 'pg';
import url from 'url';

const connectionString = 'postgresql://postgres.nbehjvipntthyttxgutt:Codjucontentcalander%40123%24@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

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

function generateFallbackSchedule(prompt, year, month, category = 'social') {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const topics = prompt ? prompt.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean) : [];
  
  if (category === 'written') {
    const defaultArticles = [
      {
        name: topics[0] || 'Deep Dive: AI Trends Shaping Content Creation',
        type: 'blog',
        platform: 'website',
        summary: 'An in-depth guide on adopting AI-driven workflows for modern content teams.',
        richText: '<p>The adoption of artificial intelligence in editorial workflows is revolutionizing content marketing.</p><h3>Key Takeaways:</h3><ul><li>Automate research and outline creation</li><li>Focus on unique human storytelling and insights</li><li>Scale distribution across multiple channels seamlessly</li></ul>',
        caption: 'How AI is reshaping modern content marketing teams in 2026 🚀'
      },
      {
        name: topics[1] || 'Monthly Newsletter: Industry Insights & Tech Highlights',
        type: 'newsletter',
        platform: 'newsletter',
        summary: 'Curated industry breakdown, product changelogs, and team highlights.',
        richText: '<p>Welcome to this month\'s edition! Here is everything you need to know about the latest product updates and industry shifts.</p>',
        caption: 'Your monthly dose of actionable strategies and tech highlights 📬'
      },
      {
        name: topics[2] || 'Case Study: 10x Engagement with Structured Calendars',
        type: 'case-study',
        platform: 'medium',
        summary: 'How leading startups use organized calendar pipelines to drive consistent organic reach.',
        richText: '<p>Consistency is the number one differentiator in content marketing success.</p>',
        caption: 'Case study breakdown: From sporadic posting to 10x organic growth 📈'
      },
      {
        name: topics[3] || 'Weekly Editorial: Building a Sustainable Brand Voice',
        type: 'blog',
        platform: 'website',
        summary: 'Core principles for maintaining consistency across social channels and long-form publications.',
        richText: '<p>Your brand voice is your moat. Here is how to codify and scale it across your entire team.</p>',
        caption: 'Why brand voice consistency matters more than ever in 2026 🎯'
      }
    ];

    return defaultArticles.map((art, idx) => {
      const day = Math.min(daysInMonth, 3 + idx * 7);
      return {
        date: `${monthStr}-${String(day).padStart(2, '0')}`,
        name: art.name,
        type: art.type,
        category: 'written',
        platform: art.platform,
        summary: art.summary,
        richText: art.richText,
        caption: art.caption
      };
    });
  }

  // Social category
  const defaultSocial = [
    {
      name: topics[0] || 'Monthly Kickoff & Vision',
      type: 'static',
      summary: 'Launch graphic highlighting team goals and content themes.',
      caption: `🚀 Welcome to a new month of growth and high-impact content! Let's make every post count. #Codju #Marketing2026`
    },
    {
      name: topics[1] || 'Product Feature Carousel',
      type: 'carousel',
      summary: 'Step-by-step breakdown carousel highlighting core features and user benefits.',
      caption: `Swipe through to see how modern teams organize their content pipeline effortlessly ✨ 👉\n\n1. Plan ahead\n2. Collaborate in real-time\n3. Publish with confidence\n\n#ContentStrategy #Productivity`
    },
    {
      name: topics[2] || 'Behind the Scenes Reel',
      type: 'reel',
      summary: 'Short, engaging video reel taking viewers behind the scenes.',
      caption: `Ever wonder how we build features that keep teams moving fast? Here is a quick BTS look! 🎬✨ #StartupLife #BehindTheScenes`
    },
    {
      name: topics[3] || 'Thought Leadership Breakdown',
      type: 'text',
      summary: 'Bite-sized insight on content scalability and audience growth.',
      caption: `The best content strategies aren't built on volume—they're built on consistency and clarity. What's your top content goal this month? 👇`
    },
    {
      name: topics[4] || 'Community Spotlight & Pro Tips',
      type: 'static',
      summary: 'Actionable tips graphic for creators and digital marketing teams.',
      caption: `💡 Pro-Tip of the Week: High-performing calendars save an average of 15 hours per week on revision cycles. Double tap if you agree!`
    }
  ];

  return defaultSocial.map((post, idx) => {
    const day = Math.min(daysInMonth, 2 + idx * 5);
    return {
      date: `${monthStr}-${String(day).padStart(2, '0')}`,
      name: post.name,
      type: post.type,
      category: 'social',
      summary: post.summary,
      caption: post.caption
    };
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
    category: row.category || 'social',
    summary: row.summary || '',
    caption: row.caption || '',
    platform: row.platform || 'instagram',
    status: row.status,
    assets: row.assets || [],
    richText: row.rich_text || '',
    script: row.script || '',
    thumbnailAsset: row.thumbnail_asset || null,
    pdfAsset: row.pdf_asset || null,
    feedback: row.feedback || '',
    feedbackAssets: row.feedback_assets || [],
    reviewedAt: row.reviewed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
          res.setHeader('Content-Type', 'application/json');
          try {
            const body = await parseBody(req);
            const { prompt, year, month, category = 'social' } = body;
            
            const fallbackKeys = [
              'AQ.Ab8RN6JKinsY86LZmNCmGAJpa2QaRg-IfhQmIJCJpdxsNmWc0A',
              'AQ.Ab8RN6LFLPrCfwHcBDQ0edSpn4mPid2mc6h4zmaZya3GTWVWug'
            ];
            const userApiKey = process.env.GEMINI_API_KEY;
            const apiKeys = userApiKey ? [userApiKey, ...fallbackKeys] : fallbackKeys;
            
            const systemInstruction = category === 'written' 
              ? `You are a professional editorial content strategist and writer.
Analyze the user's input ideas, topics, outlines, or notes, and generate a structured written content calendar (blogs, website articles, newsletters, medium/substack articles) for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Engaging Article / Newsletter Title", // Professional, catchy title, no markdown bold/italic
  "type": "blog" | "newsletter" | "case-study" | "text", // Match the most appropriate written type
  "category": "written",
  "platform": "website" | "medium" | "substack" | "newsletter" | "linkedin",
  "summary": "Short executive summary or outline of the article",
  "richText": "<p>Starter draft introduction or full outline for the written piece</p>",
  "caption": "Short summary or social hook for the article"
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`
              : `You are a professional social media content calendar assistant.
Analyze the user's input ideas, scripts, schedule, or notes, and generate a structured content calendar for the month: ${year}-${String(month).padStart(2, '0')}.
Format the output as a JSON array of objects. Do not include markdown code block formatting like \`\`\`json. Return ONLY the raw JSON string.

Each object in the array must have the following structure:
{
  "date": "YYYY-MM-DD", // Must be a valid date in the month ${year}-${String(month).padStart(2, '0')}
  "name": "Catchy Title", // Keep it short and professional, no bold/italic formatting
  "type": "static" | "carousel" | "reel" | "text", // Match the most appropriate content type
  "category": "social",
  "summary": "Short description of the content piece",
  "caption": "The actual post caption to be published" // Write a complete, high-quality caption. DO NOT use any markdown asterisks like * or ** for bold. Use plain text with line breaks and emojis if suitable.
}

Ensure all dates fall exactly within the month ${year}-${String(month).padStart(2, '0')}. Spread them out reasonably unless the input specifies exact dates.`;

            let geminiResponse;
            let lastError = null;
            let responseText = '';

            for (const key of apiKeys) {
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`;
              try {
                geminiResponse = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  signal: AbortSignal.timeout(4000),
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: {
                      responseMimeType: 'application/json'
                    }
                  })
                });

                if (geminiResponse.ok) {
                  const geminiData = await geminiResponse.json();
                  responseText = geminiData.candidates[0].content.parts[0].text;
                  lastError = null;
                  break; // Key succeeded!
                }

                const errText = await geminiResponse.text();
                try {
                  const parsed = JSON.parse(errText);
                  if (parsed.error && (parsed.error.status === 'RESOURCE_EXHAUSTED' || parsed.error.code === 429)) {
                    lastError = new Error(`Quota Exceeded: ${parsed.error.message}`);
                    console.warn(`Gemini API key ...${key.slice(-6)} rate limited. Trying next fallback key...`);
                    continue;
                  }
                  lastError = new Error(parsed.error.message || errText);
                } catch {
                  lastError = new Error(`Gemini API error: ${errText}`);
                }
              } catch (err) {
                lastError = err;
              }
            }

            if (lastError || !responseText) {
              console.warn('Gemini API unavailable, using intelligent fallback schedule generator:', lastError?.message);
              const items = generateFallbackSchedule(prompt, year, month, category);
              res.end(JSON.stringify({ success: true, items, fallback: true }));
              return;
            }
            
            let items;
            try {
              items = JSON.parse(responseText.trim());
            } catch {
              items = generateFallbackSchedule(prompt, year, month, category);
            }
            res.end(JSON.stringify({ success: true, items }));
          } catch (err) {
            console.error('Error generating AI content:', err);
            const items = generateFallbackSchedule(prompt || '', year || 2026, month || 8, category || 'social');
            res.end(JSON.stringify({ success: true, items, fallback: true }));
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
                  id, date, name, type, category, summary, caption, platform, status, assets, rich_text, script, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *
              `;
              const params = [
                item.id || ('c' + Math.random().toString(36).substr(2, 9)),
                item.date || now.split('T')[0],
                item.name || 'Untitled Content',
                item.type || (item.category === 'written' ? 'blog' : 'static'),
                item.category || 'social',
                item.summary || '',
                item.caption || '',
                item.platform || (item.category === 'written' ? 'website' : 'instagram'),
                item.status || 'draft',
                JSON.stringify(item.assets || []),
                item.richText || (item.type === 'text' ? `<p>${item.caption || ''}</p>` : ''),
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
            const queryText = 'SELECT * FROM month_notes WHERE month_key = $1';
            const result = await pool.query(queryText, [monthQuery]);
            if (result.rows.length === 0) {
              res.end(JSON.stringify({ month_key: monthQuery, notes: '' }));
            } else {
              res.end(JSON.stringify(result.rows[0]));
            }
          } catch (err) {
            console.error('Error fetching month notes:', err);
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

            const queryText = `
              INSERT INTO month_notes (month_key, notes, updated_at)
              VALUES ($1, $2, CURRENT_TIMESTAMP)
              ON CONFLICT (month_key) DO UPDATE
              SET notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP
              RETURNING *
            `;
            const result = await pool.query(queryText, [month, notes || '']);
            res.end(JSON.stringify(result.rows[0]));
          } catch (err) {
            console.error('Error saving month notes:', err);
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
              INSERT INTO content (id, date, name, type, category, summary, caption, platform, status, assets, rich_text, script, thumbnail_asset, pdf_asset, feedback, feedback_assets, reviewed_at, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
              RETURNING *
            `;

            const params = [
              body.id || ('c' + Math.random().toString(36).substr(2, 9)),
              body.date || now.split('T')[0],
              body.name || 'Untitled Content',
              body.type || (body.category === 'written' ? 'blog' : 'static'),
              body.category || 'social',
              body.summary || '',
              body.caption || '',
              body.platform || (body.category === 'written' ? 'website' : 'instagram'),
              body.status || 'draft',
              JSON.stringify(body.assets || []),
              body.richText || '',
              body.script || '',
              JSON.stringify(body.thumbnailAsset || null),
              JSON.stringify(body.pdfAsset || null),
              body.feedback || '',
              JSON.stringify(body.feedbackAssets || []),
              body.reviewedAt || null,
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
