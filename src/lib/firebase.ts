import { supabase } from './supabase';
import { safeLocalStorage } from './storage';

// -----------------------------------------------------------------------------
// Firestore Timestamp Compatibility Class
// -----------------------------------------------------------------------------
export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }

  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1000000;
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }

  static now(): Timestamp {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }

  static fromMillis(ms: number): Timestamp {
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }

  static fromDate(date: Date): Timestamp {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
}

// Helper functions for Date <-> Timestamp serialization
function deserializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Check if string matches ISO date format
    const isoDateRx = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
    if (isoDateRx.test(obj)) {
      const date = new Date(obj);
      if (!isNaN(date.getTime())) {
        return Timestamp.fromDate(date);
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deserializeTimestamps);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = deserializeTimestamps(obj[key]);
    }
    return res;
  }
  return obj;
}

function serializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (obj && typeof obj === 'object') {
    if (obj._methodName === 'serverTimestamp') {
      return new Date().toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeTimestamps);
    }
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeTimestamps(obj[key]);
    }
    return res;
  }
  return obj;
}

// -----------------------------------------------------------------------------
// Database Query Interface and References
// -----------------------------------------------------------------------------
export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit' | 'range' | 'ilike' | 'search';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
}

export class SupabaseCollectionRef {
  tableName: string;
  tenantId?: string;

  constructor(tableName: string, tenantId?: string) {
    this.tableName = tableName;
    this.tenantId = tenantId;
  }

  get path(): string {
    return this.tenantId ? `tenants/${this.tenantId}/${this.tableName}` : this.tableName;
  }
}

export class SupabaseDocRef {
  tableName: string;
  id: string;
  tenantId?: string;

  constructor(tableName: string, id: string, tenantId?: string) {
    this.tableName = tableName;
    this.id = id;
    this.tenantId = tenantId;
  }

  get path(): string {
    return this.tenantId ? `tenants/${this.tenantId}/${this.tableName}/${this.id}` : `${this.tableName}/${this.id}`;
  }
}

export class SupabaseQuery {
  collectionRef: SupabaseCollectionRef;
  constraints: QueryConstraint[];

  constructor(collectionRef: SupabaseCollectionRef, constraints: QueryConstraint[]) {
    this.collectionRef = collectionRef;
    this.constraints = constraints;
  }

  get tableName(): string {
    return this.collectionRef.tableName;
  }

  get path(): string {
    return this.collectionRef.path;
  }
}

export const db = {
  // Dummy db object for Firebase compatibility
  __isSupabaseDummy: true
};

// -----------------------------------------------------------------------------
// Firebase Firestore Methods mapped to Supabase
// -----------------------------------------------------------------------------
export const doc = (dbRef: any, pathOrCollection: any, ...segments: string[]): SupabaseDocRef => {
  if (typeof pathOrCollection === 'string') {
    const table = pathOrCollection;
    const id = segments[0];
    return new SupabaseDocRef(table, id);
  } else if (pathOrCollection instanceof SupabaseCollectionRef) {
    return new SupabaseDocRef(pathOrCollection.tableName, segments[0], pathOrCollection.tenantId);
  }
  throw new Error('[SupabaseAdapter] doc() received invalid arguments');
};

export const collection = (dbRef: any, path: string, ...segments: string[]): SupabaseCollectionRef => {
  // Subcollection nesting support: mapping tenants/{id}/audit_logs to tenant_audit_logs
  if (path === 'tenants' && segments.length === 2 && segments[1] === 'audit_logs') {
    return new SupabaseCollectionRef('tenant_audit_logs', segments[0]);
  }
  return new SupabaseCollectionRef(path);
};

export const query = (colRef: SupabaseCollectionRef, ...constraints: QueryConstraint[]): SupabaseQuery => {
  return new SupabaseQuery(colRef, constraints);
};

export const where = (field: string, op: string, value: any): QueryConstraint => {
  return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint => {
  return { type: 'orderBy', field, direction };
};

export const limit = (value: number): QueryConstraint => {
  return { type: 'limit', value };
};

export const range = (from: number, to: number): QueryConstraint => {
  return { type: 'range', field: from.toString(), value: to };
};

export const ilike = (field: string, value: string): QueryConstraint => {
  return { type: 'ilike', field, value };
};

export const search = (queryText: string, fields: string[]): QueryConstraint => {
  return { type: 'search', field: fields.join(','), value: queryText };
};

export const arrayUnion = (...elements: any[]) => {
  return {
    _methodName: 'arrayUnion',
    elements
  };
};

export const serverTimestamp = () => {
  return {
    _methodName: 'serverTimestamp'
  };
};

// Internal query engine that maps constraints to Supabase filters
async function executeQuery(q: SupabaseQuery | SupabaseCollectionRef) {
  const tableName = q instanceof SupabaseCollectionRef ? q.tableName : q.tableName;
  let builder = supabase.from(tableName).select('*', { count: 'exact' });

  const constraints = q instanceof SupabaseQuery ? q.constraints : [];
  const tenantId = q instanceof SupabaseCollectionRef ? q.tenantId : q.collectionRef.tenantId;

  if (tenantId) {
    builder = builder.eq('tenant_id', tenantId);
  }

  for (const c of constraints) {
    if (c.type === 'where') {
      const field = c.field!;
      const op = c.op!;
      const value = c.value;

      // Primary keys and tenant partitions are mapped as top-level table columns.
      // All other fields are inside the JSONB 'data' column.
      let targetColumn = `data->>${field}`;
      if (field === 'id') {
        targetColumn = 'id';
      } else if (field === 'tenantId') {
        targetColumn = 'tenant_id';
      }

      if (op === '==' || op === '===') {
        builder = builder.eq(targetColumn, value);
      } else if (op === '>') {
        builder = builder.gt(targetColumn, value);
      } else if (op === '>=') {
        builder = builder.gte(targetColumn, value);
      } else if (op === '<') {
        builder = builder.lt(targetColumn, value);
      } else if (op === '<=') {
        builder = builder.lte(targetColumn, value);
      } else if (op === 'in') {
        builder = builder.in(targetColumn, value);
      } else if (op === 'array-contains') {
        // Safe JSONB containment
        builder = builder.contains(`data->${field}`, [value]);
      }
    } else if (c.type === 'orderBy') {
      const field = c.field!;
      const ascending = c.direction === 'asc';
      if (field === 'id') {
        builder = builder.order('id', { ascending });
      } else if (field === 'created_at' || field === 'createdAt' || field === 'timestamp') {
        builder = builder.order('created_at', { ascending });
      } else {
        builder = builder.order(`data->>${field}`, { ascending });
      }
    } else if (c.type === 'limit') {
      builder = builder.limit(c.value!);
    } else if (c.type === 'range') {
      const from = parseInt(c.field!);
      const to = c.value as number;
      builder = builder.range(from, to);
    } else if (c.type === 'ilike') {
      const field = c.field!;
      const value = c.value as string;
      let targetColumn = `data->>${field}`;
      if (field === 'id') {
        targetColumn = 'id';
      }
      builder = builder.ilike(targetColumn, `%${value}%`);
    } else if (c.type === 'search') {
      const fields = c.field!.split(',');
      const queryText = c.value as string;
      if (queryText && queryText.trim() !== '') {
        const orConditions = fields.map(f => {
          let col = `data->>${f}`;
          if (f === 'id') col = 'id';
          return `${col}.ilike.%${queryText}%`;
        }).join(',');
        builder = builder.or(orConditions);
      }
    }
  }

  const { data, error, count } = await builder;
  if (error) {
    console.error(`[SupabaseAdapter] executeQuery failed for table ${tableName}:`, error);
    throw error;
  }
  return { data: data || [], count: count || 0 };
}

// Helper to write normalized journal entries and items with balance checks
async function saveJournalEntry(docId: string, serializedData: any, tenantId: any) {
  const items = serializedData.items;
  if (Array.isArray(items)) {
    const totalDebit = items.reduce((sum: number, item: any) => sum + (item.debit || 0), 0);
    const totalCredit = items.reduce((sum: number, item: any) => sum + (item.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Chứng từ kế toán mất cân đối Nợ / Có. Không thể ghi sổ!');
    }
  }

  const { items: journalItems, ...mainEntry } = serializedData;
  const dbPayload = {
    id: docId,
    tenant_id: tenantId,
    data: mainEntry,
    updated_at: new Date().toISOString()
  };

  const { error: entryError } = await supabase
    .from('journal_entries')
    .upsert(dbPayload);

  if (entryError) throw entryError;

  if (Array.isArray(journalItems)) {
    await supabase
      .from('journal_items')
      .delete()
      .eq('entry_id', docId);

    const itemsPayloads = journalItems.map((item: any) => ({
      entry_id: docId,
      account_id: item.accountId,
      debit: item.debit || 0,
      credit: item.credit || 0,
      partner_id: item.partnerId || null,
      tenant_id: tenantId || 'tenant-vcomm-prod-01'
    }));

    const { error: itemsError } = await supabase
      .from('journal_items')
      .insert(itemsPayloads);

    if (itemsError) throw itemsError;
  }
}

export const getDoc = async (docRef: SupabaseDocRef): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const { data, error } = await supabase
      .from(docRef.tableName)
      .select('*')
      .eq('id', docRef.id)
      .maybeSingle();

    if (error) throw error;

    const exists = !!data;
    const docData = exists ? data.data : null;

    if (exists) {
      if (docRef.tableName === 'journal_entries') {
        const { data: items, error: itemsError } = await supabase
          .from('journal_items')
          .select('*')
          .eq('entry_id', docRef.id);
        if (!itemsError && items) {
          docData.items = items.map((item: any) => ({
            accountId: item.account_id,
            debit: Number(item.debit),
            credit: Number(item.credit),
            partnerId: item.partner_id
          }));
        }
      }
      safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists, data: docData }));
    }

    return {
      exists: () => exists,
      data: () => deserializeTimestamps(docData),
      id: docRef.id,
      ref: docRef
    };
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] getDoc failed or timed out:`, error.message || error);
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          exists: () => parsed.exists,
          data: () => deserializeTimestamps(parsed.data),
          id: docRef.id,
          ref: docRef
        };
      } catch (e) {}
    }
    return {
      exists: () => false,
      data: () => undefined,
      id: docRef.id,
      ref: docRef
    };
  }
};

export const getDocFromServer = getDoc;

export const getDocs = async (queryRef: SupabaseQuery | SupabaseCollectionRef): Promise<any> => {
  const cacheKey = `fs_cache_docs_${queryRef.path}`;
  try {
    const { data: rows, count } = await executeQuery(queryRef);
    const docs = await Promise.all(rows.map(async (row) => {
      const data = deserializeTimestamps(row.data);
      if (queryRef.tableName === 'journal_entries') {
        const { data: items, error: itemsError } = await supabase
          .from('journal_items')
          .select('*')
          .eq('entry_id', row.id);
        if (!itemsError && items) {
          data.items = items.map((item: any) => ({
            accountId: item.account_id,
            debit: Number(item.debit),
            credit: Number(item.credit),
            partnerId: item.partner_id
          }));
        }
      }
      return {
        id: row.id,
        data: () => data,
        exists: () => true
      };
    }));

    safeLocalStorage.setItem(cacheKey, JSON.stringify(rows.map(r => ({ id: r.id, data: r.data }))));

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      count,
      forEach: (cb: any) => docs.forEach(cb)
    };
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] getDocs failed:`, error.message || error);
    const cached = safeLocalStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const docs = parsed.map((item: any) => ({
          id: item.id,
          data: () => deserializeTimestamps(item.data),
          exists: () => true
        }));
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
          count: docs.length,
          forEach: (cb: any) => docs.forEach(cb)
        };
      } catch (e) {}
    }
    return {
      docs: [],
      empty: true,
      size: 0,
      count: 0,
      forEach: () => {}
    };
  }
};

export const setDoc = async (docRef: SupabaseDocRef, data: any, options?: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const serializedData = serializeTimestamps(data);
    const tenantId = docRef.tenantId || data.tenantId || null;

    if (docRef.tableName === 'journal_entries') {
      await saveJournalEntry(docRef.id, serializedData, tenantId);
      return true;
    }

    const dbPayload = {
      id: docRef.id,
      tenant_id: tenantId,
      data: serializedData,
      updated_at: new Date().toISOString()
    };

    safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data: serializedData }));

    const { error } = await supabase
      .from(docRef.tableName)
      .upsert(dbPayload);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] setDoc failed:`, error.message || error);
    throw error;
  }
};

export const updateDoc = async (docRef: SupabaseDocRef, data: any): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    const cached = safeLocalStorage.getItem(cacheKey);
    let currentData: any = {};
    if (cached) {
      try { currentData = JSON.parse(cached).data; } catch (e) {}
    } else {
      const { data: row } = await supabase
        .from(docRef.tableName)
        .select('data')
        .eq('id', docRef.id)
        .maybeSingle();
      if (row) {
        currentData = row.data;
      }
    }

    const mergedData = { ...currentData };
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === 'object' && val._methodName === 'arrayUnion') {
        const currentArray = Array.isArray(mergedData[key]) ? mergedData[key] : [];
        const newItems = serializeTimestamps(val.elements);
        const updatedArray = [...currentArray];
        for (const item of newItems) {
          if (!updatedArray.includes(item)) {
            updatedArray.push(item);
          }
        }
        mergedData[key] = updatedArray;
      } else {
        mergedData[key] = serializeTimestamps(val);
      }
    }

    const tenantId = docRef.tenantId || mergedData.tenantId || null;

    if (docRef.tableName === 'journal_entries') {
      await saveJournalEntry(docRef.id, mergedData, tenantId);
      return true;
    }

    const dbPayload = {
      id: docRef.id,
      tenant_id: tenantId,
      data: mergedData,
      updated_at: new Date().toISOString()
    };

    safeLocalStorage.setItem(cacheKey, JSON.stringify({ exists: true, data: mergedData }));

    const { error } = await supabase
      .from(docRef.tableName)
      .upsert(dbPayload);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] updateDoc failed:`, error.message || error);
    throw error;
  }
};

export const addDoc = async (colRef: SupabaseCollectionRef, data: any): Promise<any> => {
  try {
    const id = data.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = new SupabaseDocRef(colRef.tableName, id, colRef.tenantId);
    await setDoc(docRef, { id, ...data });
    return docRef;
  } catch (error: any) {
    console.warn(`[SupabaseAdapter] addDoc failed:`, error.message || error);
    return {
      id: `mock-id-${Date.now()}`,
      path: `${colRef.tableName}/mock-id-${Date.now()}`
    };
  }
};

export const deleteDoc = async (docRef: SupabaseDocRef): Promise<any> => {
  const cacheKey = `fs_cache_doc_${docRef.path}`;
  try {
    safeLocalStorage.removeItem(cacheKey);
    const { error } = await supabase
      .from(docRef.tableName)
      .delete()
      .eq('id', docRef.id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[SupabaseAdapter] deleteDoc failed:', e);
    return false;
  }
};

export const onSnapshot = (
  queryRef: SupabaseQuery | SupabaseCollectionRef, 
  nextOrObserver: any, 
  errorCallback?: any
) => {
  const next = typeof nextOrObserver === 'function' ? nextOrObserver : nextOrObserver.next;
  const errorHandler = typeof nextOrObserver === 'function' ? errorCallback : nextOrObserver.error;

  const cacheKey = `fs_cache_docs_${queryRef.path}`;

  // 1. Initial cached render
  const cached = safeLocalStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const docs = parsed.map((item: any) => ({
        id: item.id,
        data: () => deserializeTimestamps(item.data),
        exists: () => true
      }));
      setTimeout(() => {
        try {
          next({
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (cb: any) => docs.forEach(cb)
          });
        } catch (e) {}
      }, 0);
    } catch (e) {}
  }

  // 2. Fetch fresh data right away
  getDocs(queryRef).then((snap) => {
    next(snap);
  }).catch((err) => {
    if (errorHandler) errorHandler(err);
  });

  // 3. Subscribe to Realtime Postgres Changes
  const tableName = queryRef instanceof SupabaseCollectionRef ? queryRef.tableName : queryRef.collectionRef.tableName;

  const channel = supabase
    .channel(`realtime-${tableName}-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, async () => {
      try {
        const snap = await getDocs(queryRef);
        next(snap);
      } catch (err) {
        if (errorHandler) errorHandler(err);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const handleFirestoreError = (error: any, operationType: string, path: string | null = null): never => {
  throw error;
};

// -----------------------------------------------------------------------------
// Authentication Compatibility Interface
// -----------------------------------------------------------------------------
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
}

let _currentUser: User | null = null;
const authStateCallbacks = new Set<(user: User | null) => void>();

// Synchronize auth state using Supabase Auth Listener
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    _currentUser = {
      uid: session.user.id,
      email: session.user.email ?? null,
      displayName: session.user.user_metadata?.displayName ?? session.user.email ?? null,
      emailVerified: !!session.user.email_confirmed_at,
      photoURL: session.user.user_metadata?.avatar_url ?? null
    };
  } else {
    _currentUser = null;
  }
  for (const cb of authStateCallbacks) {
    cb(_currentUser);
  }
});

export const auth = {
  get currentUser() {
    return _currentUser;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    _currentUser = null;
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  // Trigger callback with current value immediately
  callback(_currentUser);
  authStateCallbacks.add(callback);
  return () => {
    authStateCallbacks.delete(callback);
  };
};

export const signIn = async (authObj: any, email: string, password: any) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const customError = new Error(error.message) as any;
    customError.code = 'auth/invalid-credential';
    throw customError;
  }
  
  if (data.user) {
    _currentUser = {
      uid: data.user.id,
      email: data.user.email ?? null,
      displayName: data.user.user_metadata?.displayName ?? data.user.email ?? null,
      emailVerified: !!data.user.email_confirmed_at
    };
  }
  return { user: _currentUser };
};

export const createUser = async (authObj: any, email: string, password: any) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const customError = new Error(error.message) as any;
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      customError.code = 'auth/email-already-in-use';
    } else {
      customError.code = 'auth/weak-password';
    }
    throw customError;
  }
  
  const createdUser = data.user ? {
    uid: data.user.id,
    email: data.user.email ?? null,
    displayName: data.user.user_metadata?.displayName ?? data.user.email ?? null,
    emailVerified: !!data.user.email_confirmed_at
  } : null;
  
  return { user: createdUser };
};

export const logout = () => auth.signOut();

export class GoogleAuthProvider {
  addScope(scope: string) {}
  static credentialFromResult(result: any) {
    return {
      accessToken: 'mock-google-access-token-12345'
    };
  }
}

export const googleProvider = new GoogleAuthProvider();

export const signInWithPopup = async (authObj: any, providerObj: any) => {
  // Trigger oauth login
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return {
    user: {
      email: _currentUser?.email || 'admin@v-erp.com',
      uid: _currentUser?.uid || 'mock-google-uid'
    }
  };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return data;
};

export const getAuth = () => auth;


