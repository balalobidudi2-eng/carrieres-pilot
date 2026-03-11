/**
 * Test the auto-fill route to see what happens when the robot button is clicked
 */
const http = require('http');

// Simulate what the robot button sends
const payload = JSON.stringify({
  applicationUrl: 'https://candidat.francetravail.fr/offres/recherche/detail/192FHCP', // France Travail URL
  firstName: 'Ghiles',
  lastName: 'Aimeur',
  email: 'ghilesaimeur951@gmail.com',
  phone: '',
  linkedinUrl: '',
  offerTitle: 'Serveur (H/F)',
  offerCompany: 'RESTAURANT LE BRASERO',
});

// We need auth - let's just test the form-automation logic directly
const { autoFillApplicationForm } = require('./src/lib/form-automation');

async function main() {
  console.log('Testing auto-fill for RESTAURANT LE BRASERO...\n');

  const result = await autoFillApplicationForm({
    applicationUrl: 'https://candidat.francetravail.fr/offres/recherche/detail/192FHCP',
    firstName: 'Ghiles',
    lastName: 'Aimeur',
    email: 'ghilesaimeur951@gmail.com',
    offerTitle: 'Serveur (H/F)',
    offerCompany: 'RESTAURANT LE BRASERO',
  });

  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
