import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, logout, signIn, createUser } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface StaffInfo {
  id?: string;
  name: string;
  username: string;
  role: 'admin' | 'manager' | 'staff' | 'director';
  email?: string;
  phone?: string;
  department?: string;
  storeId?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  staffInfo: StaffInfo | null;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin emails loaded from env — never hardcode in source
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

function isBootstrappedAdmin(email: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const staffDoc = await getDoc(doc(db, 'staff', firebaseUser.uid));
          if (staffDoc.exists()) {
            const data = staffDoc.data() as StaffInfo;
            setIsStaff(true);
            setIsAdmin(data.role === 'admin');
            setStaffInfo(data);
          } else if (isBootstrappedAdmin(firebaseUser.email)) {
            setIsStaff(true);
            setIsAdmin(true);
            setStaffInfo({
              name: firebaseUser.displayName || 'Admin',
              role: 'admin',
              username: firebaseUser.email?.split('@')[0] || 'admin',
            });
          } else {
            setIsStaff(false);
            setIsAdmin(false);
            setStaffInfo(null);
          }
        } catch (error) {
          console.error('Error fetching staff info:', error);
          if (isBootstrappedAdmin(firebaseUser.email)) {
            setIsStaff(true);
            setIsAdmin(true);
            setStaffInfo({
              name: firebaseUser.displayName || 'Admin',
              role: 'admin',
              username: firebaseUser.email?.split('@')[0] || 'admin',
            });
          } else {
            setIsStaff(false);
            setIsAdmin(false);
            setStaffInfo(null);
          }
        }
      } else {
        setIsStaff(false);
        setIsAdmin(false);
        setStaffInfo(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const email = username.includes('@') ? username : `${username}@v-erp.com`;

    try {
      await signIn(auth, email, password);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      const isUserNotFound =
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/invalid-credential';

      // Bootstrap: create admin account on first login if email is in ADMIN_EMAILS
      if (isUserNotFound && isBootstrappedAdmin(email)) {
        try {
          const userCredential = await createUser(auth, email, password);
          await setDoc(doc(db, 'staff', userCredential.user.uid), {
            name: 'System Admin',
            username: email.split('@')[0],
            role: 'admin',
            createdAt: new Date().toISOString(),
          } satisfies StaffInfo);
          return;
        } catch (createError: unknown) {
          const createFirebaseError = createError as { code?: string };
          if (createFirebaseError.code === 'auth/email-already-in-use') throw error;
          throw createError;
        }
      }

      throw error;
    }
  };

  const signOut = async () => logout();

  const value = useMemo(
    () => ({ user, loading, isStaff, isAdmin, staffInfo, login, signOut }),
    [user, loading, isStaff, isAdmin, staffInfo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
