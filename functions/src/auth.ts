import { Request } from 'firebase-functions/v2/https';
import admin from 'firebase-admin';

export type Role = 'admin' | 'director' | 'manager' | 'staff';

export interface AuthInfo {
  uid: string;
  email?: string;
  role: Role | null;
  storeIds: string[];
}

/**
 * Verify Firebase ID token từ header `Authorization: Bearer <token>`.
 * Throw nếu token thiếu/sai. Trả về thông tin user kèm role/storeIds.
 */
export async function verifyAuth(req: Request): Promise<AuthInfo> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpAuthError(401, 'Missing bearer token');
  const token = header.substring('Bearer '.length);
  const decoded = await admin.auth().verifyIdToken(token);
  const role = (decoded.role as Role | undefined) ?? null;
  const storeIds = Array.isArray(decoded.storeIds) ? (decoded.storeIds as string[]) : [];
  return { uid: decoded.uid, email: decoded.email, role, storeIds };
}

export function requireRole(auth: AuthInfo, roles: Role[]): void {
  if (!auth.role || !roles.includes(auth.role)) {
    throw new HttpAuthError(403, `Role required: ${roles.join('|')}`);
  }
}

export class HttpAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpAuthError';
  }
}
