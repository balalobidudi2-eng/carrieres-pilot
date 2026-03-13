// Test auth against known working endpoints  
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const eq = line.indexOf('=');
  if (eq === -1 || line.trim().startsWith('#')) continue;
  const k = line.slice(0, eq).trim();
  let v = line.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const secret = process.env.JWT_SECRET;
const userId = 'cmml0hacw0000v8jw02s1lbr8'; // admin user from previous test

const TOKEN = jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
console.log('JWT_SECRET length:', secret.length);
console.log('Token:', TOKEN.slice(0, 60));

async function testEndpoint(url) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN } });
  const body = await r.text();
  console.log(url, '→', r.status, body.slice(0, 100));
}

(async () => {
  await testEndpoint('http://localhost:3000/api/external-accounts');
  await testEndpoint('http://localhost:3000/api/user/profile');
  await testEndpoint('http://localhost:3000/api/applications');
})().catch(console.error);
