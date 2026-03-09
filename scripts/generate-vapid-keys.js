#!/usr/bin/env node
// scripts/generate-vapid-keys.js
// Generate VAPID keys for Web Push notifications
// Run: node scripts/generate-vapid-keys.js

// Requires: npm install web-push --save-dev (one-time)
try {
  const webpush = require('web-push');
  const keys = webpush.generateVAPIDKeys();

  console.log('\n=== MindRoot VAPID Keys ===\n');
  console.log('Add to .env:');
  console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}\n`);
  console.log('Add to Supabase secrets:');
  console.log(`supabase secrets set VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(`supabase secrets set VAPID_PRIVATE_KEY=${keys.privateKey}`);
  console.log(`supabase secrets set VAPID_SUBJECT=mailto:your@email.com`);
  console.log('\nDone!\n');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('Install web-push first: npm install web-push --save-dev');
    console.log('Then run: node scripts/generate-vapid-keys.js');
  } else {
    throw e;
  }
}
