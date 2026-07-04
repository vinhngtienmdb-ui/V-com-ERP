# Implementation Plan: Production Hardening & DEMO_MODE Configuration

**Branch**: `002-production-hardening` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-production-hardening/spec.md`

## Summary

This plan hardens V-com-ERP for production deployments by introducing a global `DEMO_MODE` configuration, disabling fallback default credentials, disabling offline mock login bypasses in production, and preventing demo data seeding in production.

## Technical Context

- **Language/Version**: TypeScript 5.x / React 18 / Node.js 18+
- **Primary Dependencies**: `@supabase/supabase-js`
- **Storage**: PostgreSQL (Supabase database)
- **Constraints**: Offline presentation mode must only be active when `DEMO_MODE` is `true`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Configuration Hardening

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Define and export `DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'`.
- Verify Supabase client keys in `src/lib/supabase.ts`. If `DEMO_MODE` is `false` and the fallback key/URL are being used, throw an error to alert developers.

---

### Authentication Protection

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/context/AuthContext.tsx)
- Import `DEMO_MODE` from `../services/dbService`.
- In `login`: Only execute offline fallback login logic if `DEMO_MODE` is `true`.
- In `onAuthStateChanged` hook: Only execute offline bootstrap auth fallback logic if `DEMO_MODE` is `true`.

---

### UI & Seeding Protection

#### [MODIFY] [App.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/App.tsx)
- Import `DEMO_MODE` from `./services/dbService`.
- In the mounting `useEffect`, run `seedLocalStorageDemoData()` only if `DEMO_MODE` is `true`.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify clean compilation.

### Manual Verification
- Test that setting `VITE_DEMO_MODE=false` in the environment disables the offline fallback login and raises errors for missing Supabase configurations.
