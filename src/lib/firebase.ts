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
 getDoc as originalGetDoc, 
 getDocs as originalGetDocs, 
 setDoc as originalSetDoc, 
 updateDoc as originalUpdateDoc, 
 addDoc as originalAddDoc, 
 collection, 
 query, 
 where, 
 onSnapshot as originalOnSnapshot, 
 serverTimestamp,
 getDocFromServer,
 orderBy,
 limit,
 Timestamp,
 arrayUnion
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { safeLocalStorage } from './storage';

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

// Robust offline caching wrappers for Firestore actions
export const getDoc = async (docRef: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    // 1.5s fast timeout to prevent app hanging on slow networks
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
    const resultDoc = await Promise.race([
      originalGetDoc(docRef),
      timeoutPromise
    ]) as any;

    if (resultDoc && typeof resultDoc.exists === 'function') {
      const exists = resultDoc.exists();
      const data = exists ? resultDoc.data() : null;
      safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists, data }));
    }
    return resultDoc;
  } catch (error: any) {
    console.warn(`[SafeFirestore] getDoc failed or timed out for path ${docRef.path}:`, error.message || error);
    
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log(`[SafeFirestore] Serving offline cache for doc ${docRef.path}`);
        return {
          exists: () => parsed.exists,
          data: () => parsed.data,
          id: docRef.id,
          ref: docRef
        };
      } catch (e) {}
    }
    
    return {
      exists: () => false,
      data: () => undefined,
      id: docRef.id,
      ref: docRef
    };
  }
};

export const getDocs = async (queryRef: any): Promise<any> => {
  let cacheKeySuffix = 'default';
  try {
    if (queryRef.path) {
      cacheKeySuffix = queryRef.path;
    } else if (queryRef._query) {
      cacheKeySuffix = queryRef._query.path?.toString() || JSON.stringify(queryRef._query);
    } else {
      cacheKeySuffix = JSON.stringify(queryRef);
    }
  } catch (e) {}
  
  const cacheKey = `fs_cache_docs_${cacheKeySuffix}`;
  
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1500));
    const resultDocs = await Promise.race([
      originalGetDocs(queryRef),
      timeoutPromise
    ]) as any;

    if (resultDocs && resultDocs.docs) {
      const docsData = resultDocs.docs.map((d: any) => ({
        id: d.id,
        data: d.data()
      }));
      safeLocalStorage.setItem(cacheKey, JSON.stringify(docsData));
    }
    return resultDocs;
  } catch (error: any) {
    console.warn(`[SafeFirestore] getDocs failed or timed out:`, error.message || error);
    
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log(`[SafeFirestore] Serving offline cache for query docs`);
        const mockedDocs = parsed.map((item: any) => ({
          id: item.id,
          data: () => item.data,
          exists: () => true
        }));
        return {
          docs: mockedDocs,
          empty: mockedDocs.length === 0,
          size: mockedDocs.length,
          forEach: (cb: any) => mockedDocs.forEach(cb)
        };
      } catch (e) {}
    }
    
    return {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {}
    };
  }
};

export const onSnapshot = (queryRef: any, nextOrObserver: any, errorCallback?: any) => {
  let next = typeof nextOrObserver === 'function' ? nextOrObserver : nextOrObserver.next;
  let errorHandler = typeof nextOrObserver === 'function' ? errorCallback : nextOrObserver.error;
  
  let cacheKeySuffix = 'default';
  try {
    if (queryRef.path) {
      cacheKeySuffix = queryRef.path;
    } else if (queryRef._query) {
      cacheKeySuffix = queryRef._query.path?.toString() || JSON.stringify(queryRef._query);
    } else {
      cacheKeySuffix = JSON.stringify(queryRef);
    }
  } catch (e) {}
  
  const cacheKey = `fs_cache_docs_${cacheKeySuffix}`;
  
  // Instant synchronous cache dispatch (0ms initial render speed!)
  const cached = safeLocalStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const mockedDocs = parsed.map((item: any) => ({
        id: item.id,
        data: () => item.data,
        exists: () => true
      }));
      setTimeout(() => {
        try {
          next({
            docs: mockedDocs,
            empty: mockedDocs.length === 0,
            size: mockedDocs.length,
            forEach: (cb: any) => mockedDocs.forEach(cb)
          });
        } catch (e) {}
      }, 0);
    } catch (e) {}
  }

  try {
    return originalOnSnapshot(
      queryRef, 
      (snap) => {
        if (snap && snap.docs) {
          const docsData = snap.docs.map((d: any) => ({
            id: d.id,
            data: d.data()
          }));
          safeLocalStorage.setItem(cacheKey, JSON.stringify(docsData));
        }
        next(snap);
      },
      (err) => {
        console.warn(`[SafeOnSnapshot] Listener error on query:`, err.message || err);
        if (errorHandler) {
          try { errorHandler(err); } catch(e) {}
        }
      }
    );
  } catch (err: any) {
    console.warn(`[SafeOnSnapshot] Failed to register listener:`, err.message || err);
    return () => {};
  }
};

export const setDoc = async (docRef: any, data: any, options?: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    try {
      safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data }));
    } catch (e) {}
    return await originalSetDoc(docRef, data, options);
  } catch (error: any) {
    console.warn(`[SafeFirestore] setDoc failed for path ${docRef.path}:`, error.message || error);
    return null;
  }
};

export const updateDoc = async (docRef: any, data: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    try {
      const cached = safeLocalStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const updatedData = { ...parsed.data, ...data };
        safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data: updatedData }));
      } else {
        safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data }));
      }
    } catch (e) {}
    return await originalUpdateDoc(docRef, data);
  } catch (error: any) {
    console.warn(`[SafeFirestore] updateDoc failed for path ${docRef.path}:`, error.message || error);
    return null;
  }
};

export const addDoc = async (colRef: any, data: any): Promise<any> => {
  try {
    return await originalAddDoc(colRef, data);
  } catch (error: any) {
    console.warn(`[SafeFirestore] addDoc failed for collection ${colRef.path}:`, error.message || error);
    return {
      id: `mock-id-${Date.now()}`,
      path: `${colRef.path}/mock-id-${Date.now()}`
    };
  }
};

export { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  arrayUnion,
  getDocFromServer
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

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
