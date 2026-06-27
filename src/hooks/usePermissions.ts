import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { user, staffInfo, isAdmin } = useAuth();
  
  // RBAC check
  const role = staffInfo?.role || (isAdmin ? 'admin' : 'staff');

  const canCreate = role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'store_manager';
  const canEdit = role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'store_manager';
  const canDelete = role === 'admin' || role === 'super_admin';
  const canView = true;

  return {
    canCreate,
    canEdit,
    canDelete,
    canView,
    role
  };
}
