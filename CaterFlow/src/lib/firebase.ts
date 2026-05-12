import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { setDoc, serverTimestamp } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

const isPlaceholderConfig = !firebaseConfig?.apiKey || !String(firebaseConfig.apiKey).trim() || firebaseConfig.apiKey === "PLACEHOLDER";

// Avoid initializing Firebase with an empty/placeholder apiKey.
// This prevents runtime crashes like: auth/invalid-api-key.
const app = isPlaceholderConfig ? null : initializeApp(firebaseConfig);

export const db = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const googleProvider = new GoogleAuthProvider();

function assertFirebaseConfigured(): asserts auth is NonNullable<typeof auth> & { uid?: string } {
  if (!auth || !db) {
    throw new Error('Firebase is not configured (missing firebase-applet-config.json).');
  }
}

export const signInWithGoogle = async () => {
  assertFirebaseConfigured();
  try {
    return await signInWithPopup(auth!, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('User closed the login popup.');
      return null;
    }
    throw error;
  }
};

export const logout = () => {
  assertFirebaseConfigured();
  return signOut(auth!);
};

export const loginWithEmail = (email: string, pass: string) => {
  assertFirebaseConfigured();
  return signInWithEmailAndPassword(auth!, email, pass);
};

export type WorkspaceRole = 'customer' | 'admin' | 'staff';

export const signupWithEmail = async (email: string, pass: string, name: string, role: WorkspaceRole = 'customer') => {
  assertFirebaseConfigured();
  const userCredential = await createUserWithEmailAndPassword(auth!, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  await setDoc(doc(db!, 'users', userCredential.user.uid), {
    email: userCredential.user.email,
    name,
    role,
    createdAt: serverTimestamp(),
  });
  return userCredential;
};

async function testConnection() {
  if (!app) return;
  try {
    await getDocFromServer(doc(db!, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

