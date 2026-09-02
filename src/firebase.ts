import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Supplied at build time by Vite from environment variables, so no project
// keys live in this repository. Locally they come from .env (gitignored, see
// .env.example); on Cloudflare Pages from Settings -> Environment variables.
//
// Note these values still ship inside the built bundle and are readable by any
// visitor -- that is inherent to the client-side Firebase SDK. What actually
// protects the data is firestore.rules plus the `admin: true` custom claim.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Fail loudly and legibly. Without this the SDK throws a cryptic
// `auth/invalid-api-key` from deep inside a minified chunk.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase yapilandirmasi eksik: VITE_FIREBASE_* degiskenleri tanimli degil. ' +
    'Yerelde .env dosyasini olusturun (.env.example), Cloudflare Pages uzerinde ' +
    'Settings -> Environment variables bolumune ekleyin.'
  );
}

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
