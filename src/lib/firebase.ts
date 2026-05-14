import { initializeApp, FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';

import prodConfig from '../../firebase-prod-config.json';
import sandboxConfig from '../../firebase-applet-config.json';

// Chọn config theo env. VITE_FIREBASE_ENV = 'prod' | 'sandbox' (default 'prod').
const ENV = ((import.meta as any).env?.VITE_FIREBASE_ENV ?? 'prod') as 'prod' | 'sandbox';
const rawConfig = ENV === 'sandbox' ? (sandboxConfig as any) : (prodConfig as any);

const firebaseConfig: FirebaseOptions = {
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  appId: rawConfig.appId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
};

if (typeof window !== 'undefined') {
  // Log một lần để dễ kiểm chứng tenant đang dùng — KHÔNG log apiKey.
  console.info(`[firebase] ENV=${ENV} projectId=${firebaseConfig.projectId}`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = rawConfig.firestoreDatabaseId
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signIn = signInWithEmailAndPassword;
export const createUser = createUserWithEmailAndPassword;
export const logout = () => auth.signOut();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string }[];
  };
}

export const handleFirestoreError = (
  error: any,
  operationType: FirestoreErrorInfo['operationType'],
  path: string | null = null,
): never => {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error?.message ?? 'Unknown error',
    operationType,
    path,
    authInfo: {
      userId: user?.uid ?? 'anonymous',
      email: user?.email ?? '',
      emailVerified: user?.emailVerified ?? false,
      isAnonymous: user?.isAnonymous ?? true,
      providerInfo:
        user?.providerData.map((p) => ({
          providerId: p.providerId,
          displayName: p.displayName ?? '',
          email: p.email ?? '',
        })) ?? [],
    },
  };
  if (error?.message?.includes('insufficient permissions') || error?.code === 'permission-denied') {
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
};

// Lightweight ping — không throw, chỉ log.
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, '_internal', 'connection-test'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error('[firebase] connection issue — check network/firewall.');
    }
  }
})();

export { serverTimestamp };
// Re-export các API Firestore phổ biến (compat với code cũ).
export { doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, query, where, onSnapshot };
