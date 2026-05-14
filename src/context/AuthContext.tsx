import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, IdTokenResult } from 'firebase/auth';
import { auth, db, logout, signIn } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type Role = 'admin' | 'director' | 'manager' | 'staff';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: Role | null;
  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;
  staffInfo: Record<string, any> | null;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(token: IdTokenResult | null): Role | null {
  const claim = token?.claims?.role;
  if (claim === 'admin' || claim === 'director' || claim === 'manager' || claim === 'staff') return claim;
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [staffInfo, setStaffInfo] = useState<Record<string, any> | null>(null);

  async function hydrateRole(u: User | null) {
    if (!u) {
      setRole(null);
      setStaffInfo(null);
      return;
    }
    // Lấy role từ custom claims (set bởi Firebase Admin SDK, không từ Firestore).
    const tokenResult = await u.getIdTokenResult();
    setRole(extractRole(tokenResult));

    // Lấy profile từ /staff/{uid}; nếu không có thì giữ null.
    try {
      const snap = await getDoc(doc(db, 'staff', u.uid));
      setStaffInfo(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error('AuthContext: cannot read staff doc', err);
      setStaffInfo(null);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await hydrateRole(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (username: string, password: string) => {
    const email = username.includes('@') ? username : `${username}@v-erp.com`;
    await signIn(auth, email, password);
    // Không còn bootstrap admin tự tạo trong client. Admin đầu tiên phải được
    // bootstrap qua: `npm run admin:bootstrap -- --email <you@x> --role admin`.
  };

  const signOut = async () => {
    await logout();
  };

  const refreshClaims = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.getIdToken(true);
    await hydrateRole(auth.currentUser);
  };

  const isStaff = role === 'staff' || role === 'manager' || role === 'director' || role === 'admin';
  const isManager = role === 'manager' || role === 'director' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, role, isStaff, isManager, isAdmin, staffInfo, login, signOut, refreshClaims }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
