import { initializeApp } from 'firebase/app';
import { 
 getAuth, 
 GoogleAuthProvider, 
 signInWithPopup, 
 onAuthStateChanged, 
 User,
 signInWithEmailAndPassword,
 createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
 getFirestore, 
 initializeFirestore,
 persistentLocalCache,
 persistentMultipleTabManager,
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
 getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with local cache persistence capability 
const dbId = (firebaseConfig as any).firestoreDatabaseId || "(default)";

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbId);
} catch (e) {
  console.warn("Failed to initialize Firestore with persistent local cache. Falling back to memory cache.", e);
  firestoreInstance = getFirestore(app, dbId);
}

export const db = firestoreInstance;

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signIn = signInWithEmailAndPassword;
export const createUser = createUserWithEmailAndPassword;
export const logout = () => auth.signOut();

// Error handler as per instructions
export interface FirestoreErrorInfo {
 error: string;
 operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
 path: string | null;
 authInfo: {
 userId: string;
 email: string;
 emailVerified: boolean;
 isAnonymous: boolean;
 providerInfo: { providerId: string; displayName: string; email: string; }[];
 }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never => {
 const user = auth.currentUser;
 const errorInfo: FirestoreErrorInfo = {
 error: error.message || 'Unknown error',
 operationType,
 path,
 authInfo: {
 userId: user?.uid || 'anonymous',
 email: user?.email || '',
 emailVerified: user?.emailVerified || false,
 isAnonymous: user?.isAnonymous || true,
 providerInfo: user?.providerData.map(p => ({
 providerId: p.providerId,
 displayName: p.displayName || '',
 email: p.email || ''
 })) || []
 }
 };
 
 if (error.message?.includes('insufficient permissions') || error.code === 'permission-denied') {
 throw new Error(JSON.stringify(errorInfo));
 }
 throw error;
};

// Connection test
async function testConnection() {
 try {
  // Only check server if navigator is online, otherwise operate offline-first silently
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
   console.log("Operating in offline-first mode.");
   return;
  }
  await getDocFromServer(doc(db, '_internal', 'connection-test')).catch(() => {
   // Gracefully swallow connection failures during startup
  });
 } catch (error) {
  // Gracefully bypass any error
 }
}
testConnection();

export { serverTimestamp };
