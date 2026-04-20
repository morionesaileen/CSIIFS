import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Optional: Enable offline persistence so data works offline inside the brower
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn("Multiple tabs open, persistence disabled");
  } else if (err.code == 'unimplemented') {
      console.warn("Browser doesn't support persistence");
  }
});

export const auth = getAuth(app);
