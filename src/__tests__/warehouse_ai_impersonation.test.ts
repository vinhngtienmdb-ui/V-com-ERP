import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét Warehouse.tsx: `handleCreateAutoRequest` ghi đề xuất mua hàng nhưng
// `suggestStockReorder` LUÔN ném "AI disabled" → nội dung là MẪU cố định viết sẵn,
// lại mở đầu bằng "Hệ thống phân tích AI dự báo…" và `createdBy: 'system-ai-forecasting'`
// → nhân danh AI gian (pattern #77). Sửa: bọc `withCannedBanner(...)` + `createdBy`
// → `'system-reorder-template'`. Revert (trả `system-ai-forecasting` + bỏ banner) → đỏ.
const src = readFileSync(resolve(__dirname, '../components/Warehouse.tsx'), 'utf-8').replace(/\r/g, '');

describe('GĐ 2.4 — Warehouse không còn nhân danh AI (pattern #77)', () => {
  it('🔴 KHÔNG còn createdBy system-ai-forecasting', () => {
    expect(src).not.toContain('system-ai-forecasting');
  });

  it('dùng createdBy system-reorder-template (mẫu, không phải AI)', () => {
    expect(src).toContain("'system-reorder-template'");
  });

  it('nội dung mẫu được bọc banner withCannedBanner', () => {
    expect(src).toContain('withCannedBanner(');
  });
});
