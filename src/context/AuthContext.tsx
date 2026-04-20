import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, logout, signIn, createUser } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  staffInfo: any | null;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const staffDoc = await getDoc(doc(db, 'staff', user.uid));
          if (staffDoc.exists()) {
            const data = staffDoc.data();
            setIsStaff(true);
            setIsAdmin(data.role === 'admin');
            setStaffInfo(data);
          } else {
            // Check if it's the bootstrapped admin
            if (user.email === 'admin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com') {
               setIsStaff(true);
               setIsAdmin(true);
               setStaffInfo({ name: user.displayName || 'Vinh Nguyen', role: 'admin', username: user.email?.split('@')[0] });
            } else {
               setIsStaff(false);
              setIsAdmin(false);
              setStaffInfo(null);
            }
          }
        } catch (error) {
          console.error("Error fetching staff info:", error);
          setIsStaff(false);
          setIsAdmin(false);
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
    } catch (error: any) {
      // Bootstrap logic for admin
      // auth/invalid-credential often covers user-not-found in modern Firebase
      const isBootstrapAdmin = username === 'admin' && password === 'admin@1234';
      const isUserNotFound = error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential';
      
      if (isBootstrapAdmin && isUserNotFound) {
        try {
          const userCredential = await createUser(auth, email, password);
          // Create staff doc
          await setDoc(doc(db, 'staff', userCredential.user.uid), {
            name: 'System Admin',
            username: 'admin',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          return;
        } catch (createError: any) {
          // If the user already exists but we got invalid-credential before, 
          // it might be a password mismatch for the bootstrap admin.
          // Otherwise, rethrow.
          if (createError.code === 'auth/email-already-in-use') {
             throw error; 
          }
          throw createError;
        }
      }
      throw error;
    }
  };

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isStaff, isAdmin, staffInfo, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
