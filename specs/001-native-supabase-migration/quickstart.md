# Validation & Quickstart: Native Supabase Migration

**Purpose**: Steps to verify that the frontend functions correctly and compiles cleanly under the native Supabase client implementation.

## Run Validation Steps

### 1. Verification Build
Run the compiler check to ensure all components import correctly and all types compile without errors:
```bash
npm run build
```

### 2. User Authentication Check
1. Start the local server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173`.
3. Check the Console tab for any Supabase initialization warnings.
4. Try signing in and out. Verify that the Auth state successfully updates through the new Supabase Auth listener.

### 3. Listing Data & Real-time Update Check
1. Navigate to the **Đơn hàng** (Orders) tab.
2. Verify that orders are loaded and listed correctly.
3. Open a second browser window and edit/create an order.
4. Confirm that the orders listing updates instantly in the first window via Supabase Realtime Channels.
