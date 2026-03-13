// Debug: check JWT round-trip with server-simulated auth
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const secret = process.env.JWT_SECRET;
const fallback = 'dev-secret-carrieres-pilot-fallback';

console.log('JWT_SECRET loaded:', !!secret);
console.log('JWT_SECRET length:', secret ? secret.length : 0);
console.log('Using fallback?', !secret);

const effectiveSecret = secret || fallback;

// Simulate what test script does
const tok = jwt.sign({ sub: 'test-user-id' }, effectiveSecret, { expiresIn: '1h' });
console.log('\n--- Signing with effective secret ---');
try {
  const verified = jwt.verify(tok, effectiveSecret);
  console.log('Round-trip OK, sub:', verified.sub);
} catch (e) {
  console.log('FAIL:', e.message);
}

// Simulate what server does (might use fallback if env not loaded)
console.log('\n--- Server with fallback (if JWT_SECRET not in env) ---');
try {
  const verified = jwt.verify(tok, fallback);
  console.log('Verified with fallback, sub:', verified.sub);
} catch (e) {
  console.log('FAIL with fallback:', e.message);
}
