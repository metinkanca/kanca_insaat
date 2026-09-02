import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// A separate Firebase app instance used only to create dealer logins from the
// admin panel. Creating a user signs *that* instance in as the new user, so
// doing it on a secondary app keeps the admin's own session untouched.
export function getSecondaryAuth() {
  const name = 'account-creator';
  const secApp = getApps().find(a => a.name === name) || initializeApp(firebaseConfig, name);
  return getAuth(secApp);
}
