import { describe, it, expect } from 'vitest';

type Role = 'admin' | 'manager' | 'staff' | 'director';

// Logic RequireRole từ App.tsx — test độc lập không cần render
function canAccess(role: Role | undefined, allowedRoles: Role[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

describe('RBAC permission guards', () => {
  describe('/finance — admin, manager, director', () => {
    const allowed: Role[] = ['admin', 'manager', 'director'];

    it('admin được truy cập', () => expect(canAccess('admin', allowed)).toBe(true));
    it('manager được truy cập', () => expect(canAccess('manager', allowed)).toBe(true));
    it('director được truy cập', () => expect(canAccess('director', allowed)).toBe(true));
    it('staff bị chặn', () => expect(canAccess('staff', allowed)).toBe(false));
    it('chưa đăng nhập bị chặn', () => expect(canAccess(undefined, allowed)).toBe(false));
  });

  describe('/hr và /settlement — chỉ admin, director', () => {
    const allowed: Role[] = ['admin', 'director'];

    it('admin được truy cập', () => expect(canAccess('admin', allowed)).toBe(true));
    it('director được truy cập', () => expect(canAccess('director', allowed)).toBe(true));
    it('manager bị chặn', () => expect(canAccess('manager', allowed)).toBe(false));
    it('staff bị chặn', () => expect(canAccess('staff', allowed)).toBe(false));
    it('chưa đăng nhập bị chặn', () => expect(canAccess(undefined, allowed)).toBe(false));
  });
});
