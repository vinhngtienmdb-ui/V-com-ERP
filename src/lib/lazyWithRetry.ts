import React from 'react';

/**
 * Wraps dynamic import in React.lazy with automatic retry and auto-reload on stale chunk hash.
 * This completely prevents 'Failed to fetch dynamically imported module' errors in Vite SPAs.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: any }>,
  exportName?: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const componentKey = exportName || 'Component';
    const hasRefreshedKey = `vite_chunk_refreshed_${componentKey}`;
    
    try {
      const module = await factory();
      sessionStorage.removeItem(hasRefreshedKey);
      const comp = exportName ? (module[exportName] || module.default) : (module.default || Object.values(module)[0]);
      return { default: comp };
    } catch (error: any) {
      console.warn(`[lazyWithRetry] Error loading ${componentKey}, checking for chunk reload...`, error);
      
      const isDynamicImportError = 
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed');

      if (isDynamicImportError) {
        const hasRefreshed = sessionStorage.getItem(hasRefreshedKey);
        if (!hasRefreshed) {
          sessionStorage.setItem(hasRefreshedKey, 'true');
          window.location.reload();
          // Return a hanging promise while window reloads
          return new Promise(() => {});
        }
      }

      throw error;
    }
  });
}
