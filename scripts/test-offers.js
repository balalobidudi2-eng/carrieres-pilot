const https = require('https');

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(url);
    const lib = require(u.protocol === 'https:' ? 'https' : 'http');
    const req = lib.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = require(u.protocol === 'https:' ? 'https' : 'http').request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Step 1: Login
  console.log('1. Login...');
  const login = await post('http://localhost:3001/api/auth/login', { email: 'admin@carrieres-pilot.fr', password: 'Admin1234!' });
  console.log('   Status:', login.status);
  if (login.status !== 200) { console.log('   Body:', JSON.stringify(login.body)); return; }
  const token = login.body.accessToken;
  console.log('   Token OK:', token ? token.substring(0, 20) + '...' : 'MISSING');

  // Step 2: Call /api/offers/recommended
  console.log('2. GET /api/offers/recommended...');
  const rec = await get('http://localhost:3001/api/offers/recommended', { Authorization: 'Bearer ' + token });
  console.log('   Status:', rec.status);
  if (rec.status !== 200) { console.log('   Error body:', JSON.stringify(rec.body).substring(0, 300)); }
  else { console.log('   Offers count:', Array.isArray(rec.body) ? rec.body.length : Object.keys(rec.body)); }

  // Step 3: Call /api/offers (all)
  console.log('3. GET /api/offers...');
  const all = await get('http://localhost:3001/api/offers', { Authorization: 'Bearer ' + token });
  console.log('   Status:', all.status);
  if (all.status !== 200) { console.log('   Error body:', JSON.stringify(all.body).substring(0, 300)); }
  else { console.log('   Offers count:', Array.isArray(all.body) ? all.body.length : Object.keys(all.body)); }
}

main().catch(console.error);
