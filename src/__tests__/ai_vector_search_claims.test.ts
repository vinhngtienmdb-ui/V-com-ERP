import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase';

dotenv.config();

describe('AI Vector Search & Custom Claims Integration Tests', () => {
  let pgClient: pg.Client;
  const dbUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    if (!dbUrl) {
      console.warn('DATABASE_URL is not set. Skipping DB connection.');
      return;
    }
    pgClient = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
    await pgClient.connect();
  });

  afterAll(async () => {
    if (pgClient) {
      await pgClient.end();
    }
  });

  it('DATABASE_URL should be defined', () => {
    expect(dbUrl).toBeDefined();
  });

  it('should verify custom claims are synced via trigger to auth.users', async () => {
    if (!pgClient) return;

    const email = `test_trigger_claims_${Date.now()}@vcomm-erp.vn`;
    const role = 'director';
    const dept = 'Finance';
    const tenantId = 'tenant-vcomm-prod-01';

    // 1. Insert a mock user into auth.users (system schema)
    const userRes = await pgClient.query(`
      INSERT INTO auth.users (id, email, raw_app_meta_data, instance_id, aud, role)
      VALUES (
        gen_random_uuid(),
        $1,
        '{}'::jsonb,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated'
      )
      RETURNING id
    `, [email]);

    const userId = userRes.rows[0].id;
    expect(userId).toBeDefined();

    try {
      // 2. Insert into public.employees to trigger the sync
      await pgClient.query(`
        INSERT INTO public.employees (id, tenant_id, email, role, department_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, tenantId, email, role, dept]);

      // 3. Retrieve auth.users app metadata and verify custom claims
      const checkRes = await pgClient.query(`
        SELECT raw_app_meta_data 
        FROM auth.users 
        WHERE id = $1
      `, [userId]);

      const metadata = checkRes.rows[0].raw_app_meta_data;
      expect(metadata).toBeDefined();
      expect(metadata.role).toBe(role);
      expect(metadata.department_id).toBe(dept);
      expect(metadata.tenant_id).toBe(tenantId);

      // 4. Update employee details and verify update sync
      const newRole = 'manager';
      await pgClient.query(`
        UPDATE public.employees
        SET role = $1
        WHERE id = $2
      `, [newRole, userId]);

      const checkUpdateRes = await pgClient.query(`
        SELECT raw_app_meta_data 
        FROM auth.users 
        WHERE id = $1
      `, [userId]);

      const updatedMetadata = checkUpdateRes.rows[0].raw_app_meta_data;
      expect(updatedMetadata.role).toBe(newRole);

    } finally {
      // Cleanup
      await pgClient.query('DELETE FROM public.employees WHERE id = $1', [userId]);
      await pgClient.query('DELETE FROM auth.users WHERE id = $1', [userId]);
    }
  });

  it('should verify pgvector match_products RPC function works correctly', async () => {
    if (!pgClient) return;

    const prodId = `prd-test-vector-${Date.now()}`;
    const tenantId = 'tenant-vcomm-prod-01';
    
    // Create an embedding vector of length 768 filled with 0.1
    const vectorArray = Array(768).fill(0.1);
    const vectorStr = '[' + vectorArray.join(',') + ']';

    // 1. Insert product with embedding
    await pgClient.query(`
      INSERT INTO public.products (id, tenant_id, name, description, price, description_embedding)
      VALUES ($1, $2, 'Sản phẩm test vector AI', 'Mô tả test', 0.00, $3::vector)
    `, [prodId, tenantId, vectorStr]);

    try {
      // 2. Query match_products RPC
      const rpcRes = await pgClient.query(`
        SELECT * FROM match_products($1::vector, 0.5, 5, $2::text)
      `, [vectorStr, tenantId]);

      // 3. Verify similarity score is near 1.0 (cosine similarity of identical vectors)
      const found = rpcRes.rows.find(r => r.id === prodId);
      expect(found).toBeDefined();
      expect(found.similarity).toBeGreaterThan(0.99);

    } finally {
      // Cleanup
      await pgClient.query('DELETE FROM public.products WHERE id = $1', [prodId]);
    }
  });
});
