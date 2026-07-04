# Feature Spec: Production Hardening & DEMO_MODE Configuration

**Status**: Specification | **Phase**: 1. Hardening | **Author**: Antigravity

## Overview

Hardening V-com-ERP for production deployments by removing default credentials, disabling mock offline logins, preventing local demo seeds under production environments, and enforcing strict `.env` variable configuration.

## Requirements

### 1. Global DEMO_MODE parameter
- Define a global configuration constant `DEMO_MODE` that evaluates to `true` unless `VITE_DEMO_MODE` is explicitly set to `'false'` in the environment.

### 2. Hardened Auth Flow (`DEMO_MODE === false`)
- Disable all offline bypass login handlers in `AuthContext.tsx`.
- Disable default credentials and mock users (`mock-uid-superadmin`, etc.). Only allow actual logins verified through Supabase Auth.
- Hide quick-fill mock login buttons on the login screen.

### 3. Strict Config Checks
- In `supabase.ts`, if `DEMO_MODE` is `false` and `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set, fail immediately with an error instead of falling back to hardcoded demo keys.

## Success Criteria
- Under `DEMO_MODE = false` (production), unauthorized offline logins are 100% blocked.
- Mock login helper UI elements are completely hidden from the user interface.
