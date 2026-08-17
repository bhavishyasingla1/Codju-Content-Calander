import generateAiHandler from '../../api/generate-ai.js';
import notesHandler from '../../api/notes.js';
import contentBatchHandler from '../../api/content/batch.js';
import contentIdHandler from '../../api/content/[id].js';
import contentIndexHandler from '../../api/content/index.js';

export default async (request, context) => {
  const url = new URL(request.url);
  // Clean trailing slashes
  const pathname = url.pathname.replace(/\/$/, '');

  // Set up query parameters
  const query = Object.fromEntries(url.searchParams.entries());

  // Parse body
  let body = {};
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn('Could not parse request body as JSON:', e);
    }
  }

  // Mock req object
  const req = {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    query,
    body,
  };

  // Mock res object
  let responseStatus = 200;
  let responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  let responseBody = '';

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    setHeader(name, value) {
      responseHeaders[name.toLowerCase()] = value;
      return this;
    },
    json(data) {
      responseHeaders['content-type'] = 'application/json';
      responseBody = JSON.stringify(data);
      return this;
    },
    send(data) {
      responseBody = data;
      return this;
    },
    end(data) {
      if (data !== undefined) responseBody = data;
      return this;
    }
  };

  // CORS preflight handling
  if (request.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: responseHeaders,
    });
  }

  try {
    // Route matching
    if (pathname === '/api/generate-ai') {
      await generateAiHandler(req, res);
    } else if (pathname === '/api/notes') {
      await notesHandler(req, res);
    } else if (pathname === '/api/content/batch') {
      await contentBatchHandler(req, res);
    } else if (pathname.startsWith('/api/content/')) {
      const id = pathname.substring('/api/content/'.length);
      req.query.id = id;
      await contentIdHandler(req, res);
    } else if (pathname === '/api/content') {
      await contentIndexHandler(req, res);
    } else {
      return new Response(JSON.stringify({ error: `Not Found: ${pathname}` }), {
        status: 404,
        headers: { 'content-type': 'application/json', ...responseHeaders }
      });
    }

    // Ensure we send back headers properly
    return new Response(responseBody, {
      status: responseStatus,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error handling request ${pathname}:`, error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...responseHeaders }
    });
  }
};
