import dotenv from 'dotenv';
dotenv.config();

import { signIn, createUser, auth, db, setDoc, doc } from './src/lib/firebase';

async function test() {
  const email = 'admin@v-erp.com';
  const password = 'admin@1234';
  
  console.log('Testing signIn...');
  try {
    const res = await signIn(auth, email, password);
    console.log('SignIn success!', res);
  } catch (error: any) {
    console.warn('SignIn failed as expected:', error.message, 'code:', error.code);
    
    // Attempt createUser
    console.log('Attempting to create user...');
    try {
      const userCredential = await createUser(auth, email, password);
      console.log('CreateUser success!', userCredential);
      
      // Try writing to database
      console.log('Writing staff doc...');
      await setDoc(doc(db, 'staff', userCredential.user.uid), {
        name: 'System Admin',
        username: 'admin',
        role: 'admin',
        tenantId: 'tenant-vcomm-prod-01',
        createdAt: new Date().toISOString()
      });
      console.log('Staff doc written successfully!');
    } catch (createError: any) {
      console.error('CreateUser / Database write failed:', createError.message, 'code:', createError.code || createError.status);
    }
  }
}

test();
