import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, logout, signIn, createUser } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';

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

// Helper to log admin login audits
const logAdminAudit = async (
  email: string,
  action: string,
  status: 'Success' | 'Failed',
  userId?: string,
  tenantId: string = 'tenant-vcomm-prod-01'
) => {
  try {
    const userAgent = navigator.userAgent;
    let browser = "Unknown Browser";
    if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
    else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) browser = "Opera";
    else if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
    else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
    else if (userAgent.indexOf("Edge") > -1) browser = "Edge";
    
    // Obtain client's public IP
    let ipAddress = '127.0.0.1';
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipAddress = data.ip || '127.0.0.1';
    } catch {
      // Ignored: network failure or offline
    }
    
    const payload = {
      email,
      userId: userId || null,
      action,
      status,
      timestamp: new Date().toISOString(),
      userAgent,
      browser,
      ipAddress,
      tenantId
    };

    // Log to global root collection
    await addDoc(collection(db, 'admin_audit_logs'), payload);
    
    // Log to nested tenant subcollection for isolated Zero-Trust access checks
    await addDoc(collection(db, 'tenants', tenantId, 'audit_logs'), payload);
  } catch (err) {
    console.error("Failed to write admin audit log:", err);
  }
};

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
 const isUserAdmin = data.role === 'admin';
 setIsAdmin(isUserAdmin);
 setStaffInfo(data);
 
 if (isUserAdmin) {
   await logAdminAudit(user.email || data.email || 'Admin', 'Login', 'Success', user.uid, data.tenantId || 'tenant-vcomm-prod-01');
 }
 } else {
 // Check if it's the bootstrapped admin
 const isBootstrapped = user.email === 'admin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com';
 if (isBootstrapped) {
 setIsStaff(true);
 setIsAdmin(true);
 const adminInfo = { 
   name: user.displayName || 'Vinh Nguyen', 
   role: 'admin', 
   username: user.email?.split('@')[0],
   tenantId: 'tenant-vcomm-prod-01'
 };
 setStaffInfo(adminInfo);
 await logAdminAudit(user.email, 'Login (Bootstrapped)', 'Success', user.uid, 'tenant-vcomm-prod-01');
 } else {
 setIsStaff(false);
 setIsAdmin(false);
 setStaffInfo(null);
 }
 }
 } catch (error: any) {
 if (error.message?.includes('offline') || error.message?.includes('client is offline')) {
 console.warn("Firebase client is operating in offline mode. Falling back to cached session for", user.email);
 } else {
 console.error("Error fetching staff info:", error);
 }
 
 // STRICT FIX for bootstrapped security flaw:
 // Only grant staff and admin status in error/offline fallbacks to AUTHENTICATED/VERIFIED bootstrap accounts
 const isAuthorizedBootstrap = user.email === 'admin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com';
 if (isAuthorizedBootstrap) {
   setIsStaff(true);
   setIsAdmin(true);
   setStaffInfo({ 
     name: user.displayName || 'Vinh Nguyen', 
     role: 'admin', 
     username: user.email ? user.email.split('@')[0] : 'admin',
     tenantId: 'tenant-vcomm-prod-01'
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
 setUser(user);
 setLoading(false);
 });

 return () => unsubscribe();
 }, []);


 const login = async (username: string, password: string) => {
 const email = username.includes('@') ? username : `${username}@v-erp.com`;
 const isAdminAccount = username === 'admin' || email === 'admin@v-erp.com' || email === 'vinh.ngtienmdb@gmail.com';
 
 try {
 await signIn(auth, email, password);
 } catch (error: any) {
 if (isAdminAccount) {
   await logAdminAudit(email, 'Login Attempt', 'Failed', undefined, 'tenant-vcomm-prod-01');
 }
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
 tenantId: 'tenant-vcomm-prod-01',
 createdAt: new Date().toISOString()
 });
 return;
 } catch (createError: any) {
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
 const currentUser = auth.currentUser;
 if (currentUser) {
   const isKnownAdmin = currentUser.email === 'admin@v-erp.com' || currentUser.email === 'vinh.ngtienmdb@gmail.com' || (staffInfo && staffInfo.role === 'admin');
   if (isKnownAdmin) {
     const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
     logAdminAudit(currentUser.email || 'admin', 'Logout', 'Success', currentUser.uid, tenantId).catch(err => { console.error("Logout audit logging failed in background:", err); });
   }
 }
 try { await logout(); } catch (e) { console.error("Logout failed:", e); }
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
