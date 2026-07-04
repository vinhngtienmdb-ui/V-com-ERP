import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, logout, signIn, createUser, doc, getDoc, setDoc, collection, addDoc, User, onAuthStateChanged, DEMO_MODE } from '../services/dbService';
import { supabase } from '../lib/supabase';
import { safeLocalStorage } from '../lib/storage';

interface AuthContextType {
 user: User | null;
 loading: boolean;
 isStaff: boolean;
 isAdmin: boolean;
 staffInfo: any | null;
 login: (username: string, password: string) => Promise<void>;
 signOut: () => Promise<void>;
 isMfaRequired: boolean;
 mfaUserEmail: string;
 verifyMfaCode: (code: string) => Promise<void>;
 cancelMfa: () => void;
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      ipAddress = data.ip || '127.0.0.1';
    } catch (e) {
      // Ignored: network failure, request abort, or offline
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
 const [isMfaRequired, setIsMfaRequired] = useState(false);
 const [mfaUserEmail, setMfaUserEmail] = useState('');
 const [mfaVerified, setMfaVerified] = useState(false);

 useEffect(() => {
 // Aggressive fallback to prevent loading screen hang
 const forceLoadTimer = setTimeout(() => {
   setLoading(prev => {
     if (prev) console.warn("Force unlocked loading state in AuthContext.");
     return false;
   });
 }, 5000);

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
   setUser(user);
   if (user) {
     let twoFactorEnabled = false;
     try {
       const { data: userRow } = await supabase
         .from('users')
         .select('*')
         .eq('id', user.uid)
         .maybeSingle();
       if (userRow && userRow.data) {
         twoFactorEnabled = !!userRow.data.twoFactorEnabled;
       }
     } catch (err) {
       console.warn("Could not check 2FA status from Supabase:", err);
     }

      const mfaVerifiedAt = safeLocalStorage.getItem(`mfa_verified_at_${user.uid}`);
      let skipMfa = false;
      if (mfaVerifiedAt) {
        const verifiedTime = new Date(mfaVerifiedAt).getTime();
        const sixtyMinutesAgo = Date.now() - 60 * 60 * 1000;
        if (verifiedTime > sixtyMinutesAgo) {
          skipMfa = true;
        }
      }

      if (twoFactorEnabled && !skipMfa) {
        setIsMfaRequired(true);
        setMfaUserEmail(user.email || '');
        // Keep mfaVerified false so user is hidden until OTP is validated
      } else {
        setIsMfaRequired(false);
        setMfaVerified(true);
      }

     try {
       // 1. Fetch role from user_roles in Supabase
       const { data: roleRow } = await supabase
         .from('user_roles')
         .select('*')
         .eq('user_id', user.uid)
         .maybeSingle();

        const isBootstrapped = DEMO_MODE && (user.email === 'admin@v-erp.com' || user.email === 'superadmin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com' || user.email === 'admin@vcomm.vn' || user.email === 'superadmin@vcomm.vn');

       if (roleRow && !isBootstrapped) {
         const isStaffRole = roleRow.role !== 'customer';
         setIsStaff(isStaffRole);
         const isUserAdmin = roleRow.role === 'super_admin' || roleRow.role === 'store_manager';
         setIsAdmin(isUserAdmin);
         setStaffInfo({
           name: user.displayName || (roleRow.role === 'super_admin' ? 'Super Admin' : 'Staff Member'),
           role: roleRow.role,
           username: user.email?.split('@')[0] || 'staff',
           tenantId: roleRow.tenant_id,
           twoFactorEnabled: twoFactorEnabled
         });
         if (isUserAdmin) {
           logAdminAudit(user.email || 'Admin', 'Login', 'Success', user.uid, roleRow.tenant_id).catch(console.error);
         }
       } else {
         // Fallback: Check staff Firestore document
         const staffDoc = await Promise.race([
          getDoc(doc(db, 'staff', user.uid)),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
         ]);
         if (staffDoc.exists()) {
           const data = staffDoc.data();
           setIsStaff(true);
           const isUserAdmin = data.role === 'admin';
           setIsAdmin(isUserAdmin);
           setStaffInfo({
             ...data,
             twoFactorEnabled: twoFactorEnabled
           });
           
           if (isUserAdmin) {
             logAdminAudit(user.email || data.email || 'Admin', 'Login', 'Success', user.uid, data.tenantId || 'tenant-vcomm-prod-01').catch(console.error);
           }
         } else {
           // Check if it's the bootstrapped admin
           const isBootstrapped = DEMO_MODE && (user.email === 'admin@v-erp.com' || user.email === 'superadmin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com' || user.email === 'admin@vcomm.vn' || user.email === 'superadmin@vcomm.vn' || user.email === 'seller@v-erp.com');
           if (isBootstrapped) {
             setIsStaff(true);
             setIsAdmin(true);
             const adminInfo = { 
               name: user.displayName || (user.email?.startsWith('super') ? 'Super Admin' : (user.email?.startsWith('seller') ? 'Seller Demo' : 'Vinh Nguyen')), 
               role: user.email?.startsWith('seller') ? 'seller' : 'admin', 
               username: user.email?.split('@')[0],
               tenantId: 'tenant-vcomm-prod-01',
               twoFactorEnabled: twoFactorEnabled
             };
             setStaffInfo(adminInfo);
             logAdminAudit(user.email, 'Login (Bootstrapped)', 'Success', user.uid, 'tenant-vcomm-prod-01').catch(console.error);
           } else {
             setIsStaff(false);
             setIsAdmin(false);
             setStaffInfo(null);
           }
         }
       }
     } catch (error: any) {
       if (error.message?.includes('offline') || error.message?.includes('client is offline')) {
         console.warn("Firebase client is operating in offline mode. Falling back to cached session for", user.email);
       } else {
         console.error("Error fetching staff info:", error);
       }
       
       const isAuthorizedBootstrap = DEMO_MODE && (user.email === 'admin@v-erp.com' || user.email === 'superadmin@v-erp.com' || user.email === 'vinh.ngtienmdb@gmail.com' || user.email === 'admin@vcomm.vn' || user.email === 'superadmin@vcomm.vn' || user.email === 'seller@v-erp.com');
       if (isAuthorizedBootstrap) {
         setIsStaff(true);
         setIsAdmin(user.email !== 'seller@v-erp.com');
         setStaffInfo({ 
           name: user.displayName || (user.email?.startsWith('super') ? 'Super Admin' : (user.email?.startsWith('seller') ? 'Seller Demo' : 'Vinh Nguyen')), 
           role: user.email?.startsWith('seller') ? 'seller' : 'admin', 
           username: user.email ? user.email.split('@')[0] : 'admin',
           tenantId: 'tenant-vcomm-prod-01',
           twoFactorEnabled: twoFactorEnabled
         });
       } else {
         setIsStaff(false);
         setIsAdmin(false);
         setStaffInfo(null);
       }
     }
   } else {
     setIsMfaRequired(false);
     setMfaVerified(false);
     setIsStaff(false);
     setIsAdmin(false);
     setStaffInfo(null);
   }
   setUser(user);
   setLoading(false);
  });

  return () => {
     clearTimeout(forceLoadTimer);
     unsubscribe();
  };
  }, []);
 
 
  const login = async (username: string, password: string) => {
    const email = username.includes('@') ? username : `${username}@v-erp.com`;
    const isAdminAccount = username === 'admin' || username === 'superadmin' || email === 'admin@v-erp.com' || email === 'superadmin@v-erp.com' || email === 'vinh.ngtienmdb@gmail.com' || email === 'admin@vcomm.vn' || email === 'superadmin@vcomm.vn';
    const isBootstrapAdmin = (username === 'admin' && password === 'admin@1234') || (username === 'superadmin' && password === 'superadmin@1234');
    const isBootstrapSeller = username === 'seller' && password === 'seller@1234';
    
    try {
      await signIn(auth, email, password);
    } catch (error: any) {
      // Standard bootstrap check if database is online but user does not exist in Auth
      const isUserNotFound = error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential';
      
      if (DEMO_MODE && (isBootstrapAdmin || isBootstrapSeller) && isUserNotFound) {
        try {
          const userCredential = await createUser(auth, email, password);
          // Create staff doc
          await setDoc(doc(db, 'staff', userCredential.user.uid), {
            name: username === 'superadmin' ? 'Super Admin' : (username === 'seller' ? 'Seller Demo' : 'System Admin'),
            username: username,
            role: username === 'seller' ? 'seller' : 'admin',
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

      // If the account is a valid bootstrapped account with correct password,
      // we bypass Firebase Auth entirely to ensure login is always possible (e.g. when offline).
      if (DEMO_MODE && (isBootstrapAdmin || isBootstrapSeller)) {
        console.warn("Firebase Auth failed or offline. Logging in via offline bootstrapped fallback.");
        const mockUser = {
          uid: username === 'superadmin' ? 'mock-uid-superadmin' : (username === 'seller' ? 'mock-uid-seller' : 'mock-uid-admin'),
          email: email,
          displayName: username === 'superadmin' ? 'Super Admin' : (username === 'seller' ? 'Seller Demo' : 'System Admin'),
          emailVerified: true,
        } as any;
        
        setUser(mockUser);
        setIsStaff(true);
        setIsAdmin(isBootstrapAdmin);
        setStaffInfo({
          name: username === 'superadmin' ? 'Super Admin' : (username === 'seller' ? 'Seller Demo' : 'System Admin'),
          username: username,
          role: username === 'seller' ? 'seller' : 'admin',
          tenantId: 'tenant-vcomm-prod-01',
          createdAt: new Date().toISOString()
        });
        return;
      }

      if (isAdminAccount) {
        // Log failed attempt asynchronously so it doesn't block UI
        logAdminAudit(email, 'Login Attempt', 'Failed', undefined, 'tenant-vcomm-prod-01').catch(console.error);
      }

      throw error;
    }
  };
 
  const verifyMfaCode = async (code: string) => {
    if (!user) throw new Error('Không tìm thấy phiên đăng nhập.');
    try {
      let success = false;
      let message = '';
      try {
        const res = await fetch('/api/mfa/verify-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, code })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          success = true;
        } else {
          message = data.message || 'Mã xác thực không chính xác.';
        }
      } catch (fetchErr) {
        // Fallback to client-side verification if server/API is unreachable
        console.warn('API verification failed, falling back to browser Web Crypto TOTP verification:', fetchErr);
        const { clientMfaVerifyLogin } = await import('../lib/mfa');
        const res = await clientMfaVerifyLogin(user.uid, code);
        if (res.status === 'success') {
          success = true;
        } else {
          message = res.message || 'Mã xác thực không chính xác.';
        }
      }

      if (success) {
        safeLocalStorage.setItem(`mfa_verified_at_${user.uid}`, new Date().toISOString());
        setMfaVerified(true);
        setIsMfaRequired(false);
      } else {
        throw new Error(message || 'Mã xác thực không chính xác.');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi xác thực 2FA. Vui lòng kiểm tra lại mã số từ Authenticator.');
    }
  };

  const cancelMfa = () => {
    setIsMfaRequired(false);
    setMfaVerified(false);
    signOut();
  };

  const signOut = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const isKnownAdmin = currentUser.email === 'admin@v-erp.com' || currentUser.email === 'superadmin@v-erp.com' || currentUser.email === 'vinh.ngtienmdb@gmail.com' || currentUser.email === 'admin@vcomm.vn' || currentUser.email === 'superadmin@vcomm.vn' || (staffInfo && staffInfo.role === 'admin');
    if (isKnownAdmin) {
      const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
      logAdminAudit(currentUser.email || 'admin', 'Logout', 'Success', currentUser.uid, tenantId).catch(err => { console.error("Logout failed in background:", err); });
    }
  }
  try { 
    await logout(); 
    setIsMfaRequired(false);
    setMfaVerified(false);
  } catch (e) { 
    console.error("Logout failed:", e); 
  }
  };

  const activeUser = (isMfaRequired && !mfaVerified) ? null : user;
  const activeIsStaff = (isMfaRequired && !mfaVerified) ? false : isStaff;
  const activeIsAdmin = (isMfaRequired && !mfaVerified) ? false : isAdmin;
  const activeStaffInfo = (isMfaRequired && !mfaVerified) ? null : staffInfo;

 return (
 <AuthContext.Provider value={{ 
   user: activeUser, 
   loading, 
   isStaff: activeIsStaff, 
   isAdmin: activeIsAdmin, 
   staffInfo: activeStaffInfo, 
   login, 
   signOut,
   isMfaRequired,
   mfaUserEmail,
   verifyMfaCode,
   cancelMfa
 }}>
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
