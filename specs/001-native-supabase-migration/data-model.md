# Data Model & Column Mapping: Native Supabase Migration

**Purpose**: Document the data transformation utilities that will be moved from `firebase.ts` to a centralized DB helper `src/services/dbService.ts` to support clean column mapping (camelCase in UI <-> snake_case in Database).

## DB Services helper (`src/services/dbService.ts`)

We will create a service file `src/services/dbService.ts` containing the mapping rules for relational tables:

### 1. Relational Tables mapped

- `products`
- `customers`
- `orders`
- `warehouse_stock`
- `sellers`
- `settlements`
- `journal_entries`
- `journal_items`
- `wallet_transactions`

### 2. Core Functions

#### `toDbPayload(tableName: string, data: any): any`
Maps Javascript camelCase object keys into database snake_case columns.
Example:
- `imageUrl` -> `image_url`
- `costPrice` -> `cost_price`
- `tenantId` -> `tenant_id`

#### `fromDbRow(tableName: string, row: any): any`
Converts database snake_case rows into frontend camelCase structures.
Example:
- `image_url` -> `imageUrl`
- `wallet_balance` -> `walletBalance`

#### `validateJournalBalance(items: any[]): void`
Validates that a journal entry's total debits equal total credits within a 0.01 tolerance threshold.
Throws an error if mismatched: `"Chứng từ kế toán mất cân đối Nợ / Có. Không thể ghi sổ!"`
