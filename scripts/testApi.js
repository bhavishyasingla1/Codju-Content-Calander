import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testBackend() {
  console.log('Starting seamless backend integration test against dev server...');
  const baseUrl = 'http://localhost:5173';

  // 1. Fetch content
  console.log('\n--- Testing GET /api/content ---');
  try {
    const getRes = await request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/content?month=2026-07',
      method: 'GET'
    });
    console.log('GET response status:', getRes.status);
    console.log(`Fetched ${getRes.data?.length} items for July 2026 successfully.`);
  } catch (err) {
    console.error('GET request failed:', err.message);
  }

  // 2. Create content
  console.log('\n--- Testing POST /api/content ---');
  const testId = 'test_' + Math.random().toString(36).substr(2, 9);
  const testItem = {
    id: testId,
    name: 'Backend Test Post',
    date: '2026-07-15',
    type: 'static',
    caption: 'Testing seamless API integration!',
    status: 'draft',
    assets: [{ name: 'test.png', url: 'data:image/png;base64,iVBORw0KGgoAAA' }]
  };

  let createdItem = null;
  try {
    const postRes = await request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/content',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testItem);
    console.log('POST response status:', postRes.status);
    console.log('Created content name:', postRes.data?.name);
    console.log('Created content ID:', postRes.data?.id);
    createdItem = postRes.data;
  } catch (err) {
    console.error('POST request failed:', err.message);
  }

  if (createdItem) {
    // 3. Update content
    console.log('\n--- Testing PUT /api/content/:id ---');
    try {
      const putRes = await request({
        hostname: 'localhost',
        port: 5173,
        path: `/api/content/${testId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        name: 'Backend Test Post (Updated)',
        status: 'ready'
      });
      console.log('PUT response status:', putRes.status);
      console.log('Updated content name:', putRes.data?.name);
      console.log('Updated content status:', putRes.data?.status);
    } catch (err) {
      console.error('PUT request failed:', err.message);
    }

    // 4. Delete content
    console.log('\n--- Testing DELETE /api/content/:id ---');
    try {
      const deleteRes = await request({
        hostname: 'localhost',
        port: 5173,
        path: `/api/content/${testId}`,
        method: 'DELETE'
      });
      console.log('DELETE response status:', deleteRes.status);
      console.log('Delete response success:', deleteRes.data?.success);
    } catch (err) {
      console.error('DELETE request failed:', err.message);
    }
  }

  console.log('\nSeamless backend integration test complete!');
}

testBackend();
