import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage } from '../lib/storage';

const STARRED_APPS_KEY = 'vcomm_starred_apps';
const LEGACY_BOOKMARKS_KEY = 'vcomm_portal_bookmarks';

const DEFAULT_STARRED: string[] = [
  'don_hang_tmdt',
  'crm',
  'cskh_da_kenh',
  'kho_hang',
  'ke_toan',
  'nhan_su',
  'tai_san',
  'chu_ky_so',
  'it_helpdesk',
  'dieu_hanh',
];

export function useStarredApps() {
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STARRED_APPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const legacy = safeLocalStorage.getItem(LEGACY_BOOKMARKS_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          safeLocalStorage.setItem(STARRED_APPS_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_STARRED;
  });

  // Sync across tabs & window events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STARRED_APPS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setStarredIds(parsed);
        } catch {}
      }
    };

    const handleCustomChange = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setStarredIds(e.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('vcomm:starred-apps-changed' as any, handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('vcomm:starred-apps-changed' as any, handleCustomChange);
    };
  }, []);

  const isStarred = useCallback(
    (appId: string) => starredIds.includes(appId),
    [starredIds]
  );

  const toggleStar = useCallback(
    (appId: string) => {
      setStarredIds((prev) => {
        const next = prev.includes(appId)
          ? prev.filter((id) => id !== appId)
          : [...prev, appId];
        safeLocalStorage.setItem(STARRED_APPS_KEY, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent('vcomm:starred-apps-changed', { detail: next })
        );
        return next;
      });
    },
    []
  );

  return {
    starredIds,
    isStarred,
    toggleStar,
  };
}
