import { supabase } from './supabase';

export function generateBase32Secret(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function decodeBase32(secret: string): Uint8Array {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const cleanSecret = secret.replace(/=/g, '').toUpperCase();
  for (let i = 0; i < cleanSecret.length; i++) {
    const val = base32chars.indexOf(cleanSecret.charAt(i));
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.substr(i, 8);
    bytes.push(parseInt(chunk, 2));
  }
  return new Uint8Array(bytes);
}

export async function generateBrowserTOTP(secret: string, timeOffsetSteps = 0): Promise<string> {
  try {
    const keyBytes = decodeBase32(secret);
    
    // Calculate current 30-sec step count
    const epoch = Math.round(new Date().getTime() / 1000.0);
    const time = Math.floor(epoch / 30) + timeOffsetSteps;
    
    // Convert time to 8-byte buffer
    const timeBytes = new Uint8Array(8);
    let temp = time;
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }
    
    // Import key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );
    
    // Sign
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      timeBytes
    );
    
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  } catch (e) {
    console.error('Error generating TOTP in browser:', e);
    return '';
  }
}

export async function verifyBrowserTOTP(secret: string, code: string): Promise<boolean> {
  const cleanCode = code.trim();
  if (cleanCode.length !== 6 || isNaN(Number(cleanCode))) return false;
  for (let i = -1; i <= 1; i++) {
    const generated = await generateBrowserTOTP(secret, i);
    if (generated === cleanCode) {
      return true;
    }
  }
  return false;
}

export async function clientMfaVerifyAndEnable(uid: string, secret: string, code: string) {
  const isValid = await verifyBrowserTOTP(secret, code);
  if (!isValid) {
    throw new Error('Mã xác thực 2FA không chính xác hoặc đã hết hạn.');
  }
  
  // Fetch existing user row
  const { data: userRow, error: getErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
    
  if (getErr || !userRow) {
    throw new Error('Không tìm thấy người dùng trên hệ thống.');
  }
  
  const updatedData = {
    ...(userRow.data || {}),
    twoFactorEnabled: true,
    twoFactorSecret: secret
  };
  
  const { error: updErr } = await supabase
    .from('users')
    .update({ data: updatedData })
    .eq('id', uid);
    
  if (updErr) throw updErr;
  
  return { status: 'success', message: 'Kích hoạt xác thực 2 lớp thành công.' };
}

export async function clientMfaDisable(uid: string, code: string) {
  // Fetch user secret
  const { data: userRow, error: getErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
    
  if (getErr || !userRow) {
    throw new Error('Không tìm thấy người dùng trên hệ thống.');
  }
  
  const userData = userRow.data || {};
  const secret = userData.twoFactorSecret;
  if (!secret) {
    throw new Error('Tài khoản chưa kích hoạt 2FA.');
  }
  
  const isValid = await verifyBrowserTOTP(secret, code);
  if (!isValid) {
    throw new Error('Mã xác thực không chính xác.');
  }
  
  const updatedData = {
    ...userData,
    twoFactorEnabled: false,
    twoFactorSecret: null
  };
  
  const { error: updErr } = await supabase
    .from('users')
    .update({ data: updatedData })
    .eq('id', uid);
    
  if (updErr) throw updErr;
  
  return { status: 'success', message: 'Đã vô hiệu hóa 2FA.' };
}

export async function clientMfaVerifyLogin(uid: string, code: string) {
  const { data: userRow, error: getErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();
    
  if (getErr || !userRow) {
    throw new Error('Không tìm thấy thông tin người dùng.');
  }
  
  const userData = userRow.data || {};
  const secret = userData.twoFactorSecret;
  if (!secret) {
    throw new Error('Tài khoản chưa được kích hoạt 2FA.');
  }
  
  const isValid = await verifyBrowserTOTP(secret, code);
  if (!isValid) {
    throw new Error('Mã xác thực 2FA không chính xác hoặc đã hết hạn.');
  }
  
  return { status: 'success', message: 'Xác thực 2FA thành công.' };
}
