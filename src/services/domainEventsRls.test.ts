import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * M2 (audit) — revert-proof guard cho migration 006_harden_domain_events_rls.sql.
 *
 * Không thể test RLS ở tầng DB trong unit test (cần Supabase thật), nên test này
 * bảo vệ NỘI DUNG migration: đảm bảo policy được thu hẹp đúng và cụm mặc định
 * mở (`... OR tenant_id = 'tenant-vcomm-prod-01'` không kèm auth guard) đã bị loại bỏ.
 * Nếu ai revert migration về policy cũ hoặc xóa 006, test này ĐỎ.
 */

function resolveMigrationPath(): string {
  // ESM-aware: đây là FILE path, lấy dirname rồi lên 2 cấp tới project root.
  const here = dirname(fileURLToPath(import.meta.url)); // .../src/services
  const fromSource = join(
    here,
    '..', // src/services -> src
    '..', // src -> project root
    'specs',
    '022-chuan-hoa-nen-tang',
    'migrations',
    '006_harden_domain_events_rls.sql',
  );
  // Fallback nếu vitest chạy với cwd = project root.
  const fromCwd = join(
    process.cwd(),
    'specs',
    '022-chuan-hoa-nen-tang',
    'migrations',
    '006_harden_domain_events_rls.sql',
  );
  try {
    readFileSync(fromSource, 'utf-8');
    return fromSource;
  } catch {
    return fromCwd;
  }
}

describe('M2 — domain_events RLS hardening (revert-proof)', () => {
  const raw = readFileSync(resolveMigrationPath(), 'utf-8');
  // Bỏ comment để chỉ xét mã SQL (tránh đếm nhầm chuỗi nằm trong phần chú thích).
  const sql = raw
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  it('tồn tại migration 006 thu hẹp RLS domain_events', () => {
    expect(raw.length).toBeGreaterThan(0);
  });

  it('gỡ bỏ policy cũ quá lỏng', () => {
    expect(sql).toMatch(/DROP POLICY IF EXISTS domain_events_tenant_isolation/i);
  });

  it('yêu cầu ĐÃ ĐĂNG NHẬP (auth.uid() IS NOT NULL) khi truy cập tenant mặc định', () => {
    expect(sql).toMatch(
      /tenant_id\s*=\s*'tenant-vcomm-prod-01'\s*AND\s*auth\.uid\(\)\s*IS NOT NULL/i,
    );
  });

  it('MỌI cụm tenant mặc định trong mã đều đã gắn auth guard (không còn cụm mở)', () => {
    const occurrences = (sql.match(/tenant-vcomm-prod-01/gi) || []).length;
    const guarded = (
      sql.match(/tenant-vcomm-prod-01'\s*AND\s*auth\.uid\(\)\s*IS NOT NULL/gi) || []
    ).length;
    expect(occurrences).toBeGreaterThan(0);
    expect(guarded).toBe(occurrences);
  });
});
