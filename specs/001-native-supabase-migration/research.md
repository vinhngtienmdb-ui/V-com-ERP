# Technical Research: Native Supabase Migration

**Purpose**: Design direct `@supabase/supabase-js` SDK integration to replace the Firestore-like `firebase.ts` adapter layer.

## Selected Approach

We will directly use the initialized `supabase` client from `src/lib/supabase.ts` in all React components, context files, and hooks. This eliminates the dependency on `firebase.ts`.

### 1. Query Patterns Comparison

| Operation | Old Adapter (Firestore style) | New Native Supabase |
| :--- | :--- | :--- |
| **Get Doc** | `getDoc(doc(db, 'table', id))` | `supabase.from('table').select('*').eq('id', id).maybeSingle()` |
| **Get Docs** | `getDocs(query(collection(db, 'table'), where('status', '==', 'pending')))` | `supabase.from('table').select('*').eq('status', 'pending')` |
| **Insert** | `addDoc(collection(db, 'table'), data)` | `supabase.from('table').insert(payload)` |
| **Update** | `updateDoc(doc(db, 'table', id), data)` | `supabase.from('table').update(payload).eq('id', id)` |
| **Delete** | `deleteDoc(doc(db, 'table', id))` | `supabase.from('table').delete().eq('id', id)` |

### 2. Real-time Subscription Mapping

Instead of Firestore's `onSnapshot(queryRef, snapshot => { ... })`:
```typescript
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table' }, (payload) => {
    // Reload state or merge changes
  })
  .subscribe();

// Clean up
supabase.removeChannel(channel);
```

### 3. Authentication Migration

Instead of the mock `auth` object:
- **Sign In**: `supabase.auth.signInWithPassword({ email, password })`
- **Sign Up**: `supabase.auth.signUp({ email, password })`
- **Sign Out**: `supabase.auth.signOut()`
- **Auth State Changes**:
  ```typescript
  supabase.auth.onAuthStateChange((event, session) => {
    // Set current user state
  })
  ```

## Graceful Degradation & Fallback Strategy

Because the application runs in a local demo/presentation environment without a persistent live backend, all Supabase database queries must handle failures gracefully.
If a network error occurs (or if Supabase is offline):
1. Fallback to `localStorage` cache read/write.
2. Maintain local component state for CRUD operations.
3. Fallback to pre-populated mock datasets (e.g., `erp_products.json` or inline mock tables).
This ensures the app's interactive features continue to function perfectly during presentation even if offline.
