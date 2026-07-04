# Implementation Plan: Native Supabase Migration

**Branch**: `001-native-supabase-migration` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-native-supabase-migration/spec.md`

## Summary

This plan outlines how to remove the legacy `firebase.ts` adapter layer and migrate V-com-ERP to consume native `@supabase/supabase-js` APIs directly. We will consolidate database helpers, relational mappings, real-time channels, and authentication handlers into a clean `src/services/dbService.ts` module, redirect all frontend imports, and then delete the legacy file.

## Technical Context

- **Language/Version**: TypeScript 5.x / React 18 / Node.js 18+
- **Primary Dependencies**: `@supabase/supabase-js`
- **Storage**: PostgreSQL (Supabase database)
- **Testing**: Vitest
- **Target Platform**: Web SPA
- **Project Type**: Web Application
- **Performance Goals**: Database query and real-time synchronization latency < 200ms
- **Constraints**: Offline presentation mode must degrade gracefully using local caching

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Centralized DB Service

#### [NEW] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Implement database camelCase <-> snake_case relational payload converters.
- Implement native Supabase query helpers: `getDoc`, `getDocs`, `setDoc`, `addDoc`, `updateDoc`, `deleteDoc`.
- Implement native Supabase Auth helpers: `signIn`, `createUser`, `logout`, `onAuthStateChanged`.
- Implement native Postgres changes Realtime listener subscription helper: `onSnapshot`.
- Ensure robust local cache fallback if Supabase is offline.

---

### Component & Hook Migrations

Modify imports in all components and hooks from `../lib/firebase` or `src/lib/firebase` to `src/services/dbService`:

#### [MODIFY] Components
- [ActivityFeed.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/ActivityFeed.tsx)
- [CommandPalette.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/CommandPalette.tsx)
- [Customers.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Customers.tsx)
- [Dashboard.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Dashboard.tsx)
- [DeviceLeasing.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/DeviceLeasing.tsx)
- [EMenu.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/EMenu.tsx)
- [Finance.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Finance.tsx)
- [HR.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/HR.tsx)
- [Orders.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Orders.tsx)
- [PageEditorModal.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/PageEditorModal.tsx)
- [PIM.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/PIM.tsx)
- [RequestHub.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/RequestHub.tsx)
- [SellerFinance.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/SellerFinance.tsx)
- [Sellers.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Sellers.tsx)
- [Settings.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Settings.tsx)
- [Settlement.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Settlement.tsx)
- [SignatureHub.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/SignatureHub.tsx)
- [VCommSupermarket.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/VCommSupermarket.tsx)
- [Warehouse.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Warehouse.tsx)

#### [MODIFY] Contexts & Hooks
- [AuthContext.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/context/AuthContext.tsx)
- [StoreContext.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/context/StoreContext.tsx)
- [useAuditLog.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/hooks/useAuditLog.ts)
- [useSepayListener.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/hooks/useSepayListener.ts)

---

### Clean Up

#### [DELETE] [firebase.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/lib/firebase.ts)
- Delete the legacy file completely after all imports are successfully redirected and verified.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify clean TypeScript compilation and static import correctness.

### Manual Verification
- Test Authentication (Sign in, Sign out).
- Test Real-time subscriptions and data updates across list tables.
