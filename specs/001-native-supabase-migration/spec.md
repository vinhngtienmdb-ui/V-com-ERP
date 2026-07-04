# Feature Specification: Native Supabase Migration

**Feature Branch**: `001-native-supabase-migration`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Loại bỏ adapter firebase.ts, chuyển sang Supabase JS SDK trực tiếp"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authentication & Session Management (Priority: P1)

Users can sign in, sign up, sign out, and maintain sessions using native `@supabase/supabase-js` Auth methods directly from the AuthContext without intermediate firebase.ts adapter helpers.

**Why this priority**: Correct authentication is a hard dependency for all other user operations and modules.

**Independent Test**: Clear localStorage, launch app, sign in with email/password, verify that AuthContext exposes the correct user object.

**Acceptance Scenarios**:
1. **Given** a user is on the login page, **When** they submit valid credentials, **Then** they are authenticated via Supabase Auth and redirected to the dashboard.
2. **Given** a logged-in user, **When** they click logout, **Then** their Supabase session is destroyed and they are redirected to login.

---

### User Story 2 - Real-time Data Listening & Collection Queries (Priority: P1)

Core list tables (Customers, Orders, HR, EMenu, SignatureHub) query data directly via `.from().select()` and subscribe to realtime Postgres changes via `.channel().on('postgres_changes').subscribe()` instead of relying on the Firestore-like `onSnapshot` mock.

**Why this priority**: Real-time listing update is crucial for active ERP monitoring across multiple staff members.

**Independent Test**: Open the Orders view, perform an order status update from another window/API, and verify that the orders table updates automatically.

**Acceptance Scenarios**:
1. **Given** the Orders page is loaded, **When** a database insert or update event occurs, **Then** the orders list automatically updates in real-time.

---

### User Story 3 - Transactional Financial Operations (Priority: P2)

Settlement and Wallet updates write entries directly to `journal_entries` and `journal_items` tables using native Supabase client queries, maintaining debit-credit balancing validation rules.

**Why this priority**: Financial records must be strictly validated and written transactionally to avoid ledger corruption.

**Independent Test**: Trigger a payout or deposit, and verify the balanced debit/credit records are written to Postgres.

**Acceptance Scenarios**:
1. **Given** a new journal entry request, **When** the total debit and credit amounts do not match, **Then** the system rejects the transaction.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Replace all imports of Firestore mock functions (`collection`, `doc`, `query`, `where`, `onSnapshot`, `addDoc`, `updateDoc`, `setDoc`, `deleteDoc`) in all frontend components with native `@supabase/supabase-js` client query builders (`supabase.from()`).
- **FR-002**: Replace Firebase Auth compatibility methods (`signIn`, `createUser`, `logout`, `onAuthStateChanged`) in `AuthContext.tsx` with native Supabase Auth methods (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signOut`, `supabase.auth.onAuthStateChange`).
- **FR-003**: Rewrite real-time data synchronization to use `supabase.channel()` subscription listeners in all listing views.
- **FR-004**: Convert the current `wallet_transactions` and `journal_entries` multi-step inserts in `firebase.ts` to utility functions inside `src/services/dbService.ts` or inline queries.
- **FR-005**: Eliminate `src/lib/firebase.ts` entirely from the codebase once all component dependencies are resolved.

### Key Entities

- **UserSession**: Represents the active Supabase Auth user session (contains access tokens, user metadata, ID).
- **RelationalPayload**: Structured payload mapping javascript camelCase fields to postgres snake_case database columns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All components run and display data correctly using native Supabase client.
- **SC-002**: The project builds successfully (`npm run build`) without any TypeScript compilation errors.
- **SC-003**: The mock adapter file `firebase.ts` is deleted, reducing import complexity and removing intermediate abstraction layers.

## Assumptions

- We assume the existing Supabase configuration inside `src/lib/supabase.ts` is fully initialized and operational.
- Database schemas on Supabase correspond to the structures mapped in `firebase.ts` relational table configurations.
