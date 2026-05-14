import { defineString, defineSecret } from 'firebase-functions/params';

/**
 * Cấu hình runtime cho Cloud Functions của VComm ERP.
 *
 * Secrets dùng cho production: bind qua `firebase functions:secrets:set <NAME>`.
 *   firebase functions:secrets:set GEMINI_API_KEY
 *   firebase functions:secrets:set SEPAY_API_TOKEN
 *   firebase functions:secrets:set SEPAY_WEBHOOK_SECRET
 *
 * Strings (non-secret) đặt qua env hoặc tham số mặc định.
 */

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
export const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-2.5-flash' });

export const SEPAY_API_TOKEN = defineSecret('SEPAY_API_TOKEN');
export const SEPAY_WEBHOOK_SECRET = defineSecret('SEPAY_WEBHOOK_SECRET');

export const REGION = 'asia-southeast1';
