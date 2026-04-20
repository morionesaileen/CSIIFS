import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

console.log('Testing Admin auth...');
try {
  let configStr = fs.readFileSync('firebase-applet-config.json', 'utf8');
  let config = JSON.parse(configStr);
  const app = initializeApp({
     credential: applicationDefault(),
     projectId: config.projectId
  });
  const db = getFirestore(app, config.firestoreDatabaseId); // <-- The Fix
  db.collection('test').doc('ping').set({ ts: Date.now() }).then(() => {
     console.log('Admin SDK works!');
     process.exit(0);
  }).catch(e => {
     console.error('Admin DB Write Failed:', e);
     process.exit(1);
  });
} catch (e) {
  console.log('Admin Init Failed', e);
  process.exit(1);
}
