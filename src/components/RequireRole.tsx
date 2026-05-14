import React from 'react';
import { useAuth, type Role } from '../context/AuthContext';
import { AccessDenied } from './AccessDenied';
import { LoadingScreen } from './LoadingScreen';

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
  /** Fallback hiển thị khi user không có role hợp lệ. Mặc định là <AccessDenied />. */
  fallback?: React.ReactNode;
}

/**
 * Chặn render children nếu user hiện tại không thuộc một trong `roles`.
 * Dùng cho các route nhạy cảm: /finance, /hr, /settlement, /compliance, /seller-finance, /signature.
 *
 * Nguyên tắc: đây CHỈ là client-side guard, bảo vệ Firestore vẫn nằm ở `firestore.rules`.
 * Client-side guard chỉ để UX (không hiển thị nút/route user không thể dùng).
 */
export function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!role || !roles.includes(role)) return <>{fallback ?? <AccessDenied />}</>;
  return <>{children}</>;
}

/** Hàm hỗ trợ kiểm tra (cùng logic như rbac.test.ts). */
export function canAccess(role: Role | undefined | null, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
