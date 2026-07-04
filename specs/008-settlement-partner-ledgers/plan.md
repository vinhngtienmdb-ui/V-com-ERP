# Implementation Plan: Settlement Partner Ledgers (Phase 2)

**Branch**: `008-settlement-partner-ledgers` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-settlement-partner-ledgers/spec.md`

## Summary

This plan updates the database mapping configurations and integrates automatic partner ledger debit/credit logging when settlements and withdrawal payout transactions are approved.

## Constitution Check

Verify that this plan adheres to the V-com-ERP Core Principles:
- [x] Detail views use fullscreen modal or slide-over layout (Principle I)
- [x] List tables use `ResizableTh` and `useTableColumns` for auto-saving sizes (Principle II)
- [x] Backend integrations are simulated on the client-side (Principle III)
- [x] TypeScript check and `npm run build` verify correctness (Principle IV)
- [x] Styles use modern aesthetics, gradients, and HSL variables (Principle V)

## Proposed Changes

### Database Service Update

#### [MODIFY] [dbService.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/services/dbService.ts)
- Add `'partner_ledgers'` to `RELATIONAL_TABLES`.
- Add mappings, serialization, and deserialization helper methods.
- Implement `recordPartnerLedgerEntry` helper function to handle liability balances math.

---

### Settlement Flow Update

#### [MODIFY] [Settlement.tsx](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/components/Settlement.tsx)
- Call `recordPartnerLedgerEntry` inside `approveSettlement` (Credit entry) and `approveWithdrawal` (Debit entry).

---

### Verification Test Cases

#### [NEW] [partner_ledgers.test.ts](file:///C:/Users/VINHNT/.gemini/antigravity/scratch/V-com-ERP/src/__tests__/partner_ledgers.test.ts)
- Create unit tests validating:
  - Liability account balance calculation math (`newBalance = previous + credit - debit`).
  - Correct logging parameters inserted to `partner_ledgers` table.

## Verification Plan

### Automated Tests
- Run `npx vitest run src/__tests__/partner_ledgers.test.ts` to verify functionality.
- Run `npm run build` to verify clean compilation.
