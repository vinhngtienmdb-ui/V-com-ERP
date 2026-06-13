import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

describe('Cryptographic Digital Signatures & Integrity Verification Tests', () => {
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

  it('should verify RSA key generation, public key storage and lookup in user_keypairs', async () => {
    if (!pgClient) return;

    const testUser = `test_signer_${Date.now()}@vcomm-erp.vn`;
    const tenantId = 'tenant-vcomm-prod-01';

    // 1. Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();

    try {
      // 2. Insert Public Key to database
      const subject = `CN=Test Signer, O=VComm ERP, C=VN`;
      await pgClient.query(`
        INSERT INTO public.user_keypairs (user_id, tenant_id, public_key, cert_subject, updated_at)
        VALUES ($1, $2, $3, $4, now())
      `, [testUser, tenantId, publicKey, subject]);

      // 3. Verify public key is saved
      const checkRes = await pgClient.query(`
        SELECT * FROM public.user_keypairs WHERE user_id = $1
      `, [testUser]);

      expect(checkRes.rows.length).toBe(1);
      expect(checkRes.rows[0].public_key).toBe(publicKey);
      expect(checkRes.rows[0].cert_subject).toBe(subject);

    } finally {
      // Cleanup
      await pgClient.query('DELETE FROM public.user_keypairs WHERE user_id = $1', [testUser]);
    }
  });

  it('should verify document signing and successful cryptographic signature verification', async () => {
    if (!pgClient) return;

    const testUser = `test_signer_verify_${Date.now()}@vcomm-erp.vn`;
    const testDocId = `REQ-TEST-CRYPT-${Date.now()}`;
    const tenantId = 'tenant-vcomm-prod-01';

    // 1. Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // 2. Save public key
    await pgClient.query(`
      INSERT INTO public.user_keypairs (user_id, tenant_id, public_key, cert_subject, updated_at)
      VALUES ($1, $2, $3, 'CN=Test Verification, O=VComm, C=VN', now())
    `, [testUser, tenantId, publicKey]);

    // 3. Define document contents
    const documentData = {
      id: testDocId,
      title: 'Đề xuất chi phí dự án AI RAG',
      type: 'request',
      date: '13/06/2026'
    };

    try {
      // 4. Create signature
      const docStr = JSON.stringify(documentData);
      const docHash = crypto.createHash('sha256').update(docStr).digest('hex');

      const sign = crypto.createSign('SHA256');
      sign.update(docStr);
      const signature = sign.sign(privateKey, 'base64');

      // 5. Store signature in document_signatures table
      await pgClient.query(`
        INSERT INTO public.document_signatures (tenant_id, document_id, document_type, signer_email, signer_name, signature_hash, document_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      `, [tenantId, testDocId, 'request', testUser, 'Test User', signature, docHash]);

      // 6. Verification test - retrieve signature and public key from DB
      const sigRes = await pgClient.query(`
        SELECT * FROM public.document_signatures WHERE document_id = $1
      `, [testDocId]);

      expect(sigRes.rows.length).toBe(1);
      const dbSig = sigRes.rows[0];

      const keyRes = await pgClient.query(`
        SELECT public_key FROM public.user_keypairs WHERE user_id = $1
      `, [dbSig.signer_email]);

      expect(keyRes.rows.length).toBe(1);
      const dbPublicKey = keyRes.rows[0].public_key;

      // Verify cryptographic signature matches the current document content
      const verify = crypto.createVerify('SHA256');
      verify.update(docStr);
      const isVerified = verify.verify(dbPublicKey, dbSig.signature_hash, 'base64');
      const hashMatches = dbSig.document_hash === docHash;

      expect(isVerified).toBe(true);
      expect(hashMatches).toBe(true);

    } finally {
      // Cleanup
      await pgClient.query('DELETE FROM public.document_signatures WHERE document_id = $1', [testDocId]);
      await pgClient.query('DELETE FROM public.user_keypairs WHERE user_id = $1', [testUser]);
    }
  });

  it('should fail verification if document content has been tampered (Integrity violation)', async () => {
    if (!pgClient) return;

    const testUser = `test_signer_tamper_${Date.now()}@vcomm-erp.vn`;
    const testDocId = `REQ-TEST-TAMPER-${Date.now()}`;
    const tenantId = 'tenant-vcomm-prod-01';

    // 1. Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    // 2. Save public key
    await pgClient.query(`
      INSERT INTO public.user_keypairs (user_id, tenant_id, public_key, cert_subject, updated_at)
      VALUES ($1, $2, $3, 'CN=Test Tamper, O=VComm, C=VN', now())
    `, [testUser, tenantId, publicKey]);

    // 3. Define original document contents
    const originalDocumentData = {
      id: testDocId,
      title: 'Đề xuất mua sắm 5 server GPU',
      type: 'request',
      date: '13/06/2026'
    };

    try {
      // 4. Create signature of original content
      const origDocStr = JSON.stringify(originalDocumentData);
      const origDocHash = crypto.createHash('sha256').update(origDocStr).digest('hex');

      const sign = crypto.createSign('SHA256');
      sign.update(origDocStr);
      const signature = sign.sign(privateKey, 'base64');

      // 5. Store signature in document_signatures
      await pgClient.query(`
        INSERT INTO public.document_signatures (tenant_id, document_id, document_type, signer_email, signer_name, signature_hash, document_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
      `, [tenantId, testDocId, 'request', testUser, 'Test User', signature, origDocHash]);

      // 6. Simulate Tampering - change title to "50 server GPU" (tampered content)
      const tamperedDocumentData = {
        ...originalDocumentData,
        title: 'Đề xuất mua sắm 50 server GPU'
      };

      const tamperedDocStr = JSON.stringify(tamperedDocumentData);
      const tamperedDocHash = crypto.createHash('sha256').update(tamperedDocStr).digest('hex');

      // 7. Verify cryptographic signature against tampered content
      const sigRes = await pgClient.query(`
        SELECT * FROM public.document_signatures WHERE document_id = $1
      `, [testDocId]);

      const dbSig = sigRes.rows[0];
      const keyRes = await pgClient.query(`
        SELECT public_key FROM public.user_keypairs WHERE user_id = $1
      `, [dbSig.signer_email]);

      const dbPublicKey = keyRes.rows[0].public_key;

      const verify = crypto.createVerify('SHA256');
      verify.update(tamperedDocStr);
      const isVerified = verify.verify(dbPublicKey, dbSig.signature_hash, 'base64');
      const hashMatches = dbSig.document_hash === tamperedDocHash;

      // Expect verification to fail
      expect(isVerified && hashMatches).toBe(false);

    } finally {
      // Cleanup
      await pgClient.query('DELETE FROM public.document_signatures WHERE document_id = $1', [testDocId]);
      await pgClient.query('DELETE FROM public.user_keypairs WHERE user_id = $1', [testUser]);
    }
  });
});
