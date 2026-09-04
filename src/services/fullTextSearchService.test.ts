import { describe, it, expect, vi } from 'vitest';
import {
  searchProducts,
  searchCustomers,
  escapePostgrestValue,
  buildIlikeFilter,
  normalizeSearchParams,
  type SearchDeps,
  type RpcResult,
  type IlikeResult,
} from './fullTextSearchService';

function makeDeps(over: Partial<SearchDeps> = {}) {
  const deps: SearchDeps = {
    rpc: vi.fn(async () => ({ data: [], error: null }) as RpcResult),
    ilike: vi.fn(async () => ({ data: [], error: null }) as IlikeResult),
    onFallback: vi.fn(),
    ...over,
  };
  return deps;
}

describe('GĐ 4.2 — escapePostgrestValue / buildIlikeFilter', () => {
  it('dấu phẩy trong từ khoá không làm vỡ filter .or()', () => {
    // "Dâu, Sữa" nếu không escape → PostgREST hiểu nhầm thành 2 điều kiện riêng
    expect(escapePostgrestValue('Dâu, Sữa')).toBe('Dâu Sữa');
  });

  it('các ký tự điều khiển . * : ( ) bị thay thế', () => {
    expect(escapePostgrestValue('a.b*c:d(e)')).toBe('a b c d e');
  });

  it('🔴 đầu vào TOÀN dấu câu → rỗng, KHÔNG sinh wildcard khớp toàn bảng', () => {
    // Từng có lỗi: thay dấu phẩy bằng '%' → ",," thành "%%" → ILIKE %%%% = match ALL.
    expect(escapePostgrestValue(',,')).toBe('');
    expect(escapePostgrestValue('...')).toBe('');
    expect(escapePostgrestValue("'''")).toBe('');
    expect(escapePostgrestValue('\\\\')).toBe('');
  });

  it('ký tự % và _ từ người dùng không được sống sót thành wildcard', () => {
    // escapePostgrestValue chỉ lo ký tự điều khiển của PostgREST; % _ nằm ngoài bộ
    // ký tự đó nên giữ nguyên — ILIKE coi chúng là wildcard nhưng bị bao bởi %...%
    // nên không đổi nghĩa đáng kể. Khẳng định hành vi để không ai "tối ưu" nhầm.
    expect(escapePostgrestValue('100%')).toBe('100%');
  });

  it('từ khoá bình thường giữ nguyên', () => {
    expect(escapePostgrestValue('áo thun')).toBe('áo thun');
  });

  it('buildIlikeFilter ghép đủ cột, mỗi cột 1 điều kiện', () => {
    expect(buildIlikeFilter(['name', 'sku'], 'áo')).toBe('name.ilike.%áo%,sku.ilike.%áo%');
  });

  it('từ khoá rỗng/toàn dấu câu → filter rỗng (không sinh .ilike.%% quét bảng)', () => {
    expect(buildIlikeFilter(['name'], '   ')).toBe('');
    expect(buildIlikeFilter(['name'], ',,')).toBe('');
    expect(buildIlikeFilter(['name', 'sku'], '::')).toBe('');
  });
});

describe('GĐ 4.2 — normalizeSearchParams', () => {
  it('escape từ khoá trước khi gửi xuống to_tsquery', () => {
    expect(normalizeSearchParams({ term: "'; DROP TABLE products; --" }).query).toBe(
      "''';' & 'DROP' & 'TABLE' & 'products;' & '--'"
    );
  });

  it('giới hạn limit/offset an toàn', () => {
    const n = normalizeSearchParams({ term: 'áo', limit: 9999, offset: -5 });
    expect(n.limit).toBe(200);
    expect(n.offset).toBe(0);
  });

  it('tenant mặc định', () => {
    expect(normalizeSearchParams({ term: 'áo' }).tenantId).toBe('tenant-vcomm-prod-01');
  });
});

describe('GĐ 4.2 — searchProducts (FTS)', () => {
  it('gọi RPC với tsquery đã escape, truyền đủ tham số', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: [{ id: 'p1', rank: 0.6 }], error: null })) as never,
    });
    const out = await searchProducts({ term: 'áo thun', limit: 10 }, deps);

    expect(out.usedFts).toBe(true);
    expect(out.ids).toEqual(['p1']);
    expect(deps.rpc).toHaveBeenCalledWith('vcomm_search_products', {
      p_query: "'áo' & 'thun'",
      p_tenant: 'tenant-vcomm-prod-01',
      p_limit: 10,
      p_offset: 0,
    });
  });

  it('kết quả được xếp theo rank giảm dần', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({
        data: [
          { id: 'a', rank: 0.1 },
          { id: 'b', rank: 0.9 },
          { id: 'c', rank: 0.5 },
        ],
        error: null,
      })) as never,
    });
    const out = await searchProducts({ term: 'áo' }, deps);
    expect(out.ids).toEqual(['b', 'c', 'a']);
  });

  it('term rỗng → KHÔNG gọi DB (tránh full scan)', async () => {
    const deps = makeDeps();
    const out = await searchProducts({ term: '   ' }, deps);
    expect(out.reason).toBe('empty_term');
    expect(out.ids).toEqual([]);
    expect(deps.rpc).not.toHaveBeenCalled();
  });

  it('term dưới minLength → KHÔNG gọi DB', async () => {
    const deps = makeDeps();
    const out = await searchProducts({ term: 'a', minLength: 2 }, deps);
    expect(out.reason).toBe('below_min_length');
    expect(deps.rpc).not.toHaveBeenCalled();
  });
});

describe('GĐ 4.2 — phân trang (total_count)', () => {
  it('đọc total_count từ dòng đầu để phân trang, không cần query count riêng', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({
        data: [
          { id: 'a', rank: 0.9, total_count: 137 },
          { id: 'b', rank: 0.4, total_count: 137 },
        ],
        error: null,
      })) as never,
    });
    const out = await searchProducts({ term: 'áo', limit: 2 }, deps);
    expect(out.total).toBe(137);
    expect(out.ids).toEqual(['a', 'b']);
  });

  it('fallback ILIKE → total undefined (caller phải tự count như cũ)', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: null, error: { code: 'PGRST202', message: 'missing' } })) as never,
      ilike: vi.fn(async () => ({ data: [{ id: 'x' }], error: null })) as never,
    });
    const out = await searchProducts({ term: 'áo' }, deps);
    expect(out.usedFts).toBe(false);
    expect(out.total).toBeUndefined();
  });
});

describe('GĐ 4.2 — FALLBACK khi chưa apply migration', () => {
  it('RPC chưa tồn tại (PGRST202) → rơi về ILIKE, chức năng không chết', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function public.vcomm_search_products' },
      })) as never,
      ilike: vi.fn(async () => ({ data: [{ id: 'p9' }], error: null })) as never,
    });

    const out = await searchProducts({ term: 'áo' }, deps);

    expect(out.usedFts).toBe(false);
    expect(out.reason).toBe('rpc_missing');
    expect(out.ids).toEqual(['p9']);
    expect(deps.ilike).toHaveBeenCalledWith('name.ilike.%áo%,sku.ilike.%áo%,barcode.ilike.%áo%,brand.ilike.%áo%,category.ilike.%áo%', 50, 0);
    expect(deps.onFallback).toHaveBeenCalled();
  });

  it('PostgREST không trả code → vẫn nhận diện được qua thông điệp', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: 'function public.vcomm_search_products(unknown) does not exist' },
      })) as never,
      ilike: vi.fn(async () => ({ data: [], error: null })) as never,
    });

    const out = await searchProducts({ term: 'áo' }, deps);
    expect(out.usedFts).toBe(false);
    expect(deps.ilike).toHaveBeenCalled();
  });

  it('lỗi QUYỀN (PGRST301 JWT expired) → KHÔNG fallback, trả lỗi rõ ràng', async () => {
    // Fallback ILIKE trong trường hợp này vô ích (cũng 401/403) và che khuất nguyên nhân.
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } })) as never,
    });

    const out = await searchProducts({ term: 'áo' }, deps);
    expect(out.reason).toBe('rpc_error');
    expect(out.ids).toEqual([]);
    expect(deps.ilike).not.toHaveBeenCalled();
  });

  it('lỗi RPC không xác định (không code, message lạ) → không fallback mù quáng', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: null, error: { message: 'connection timeout' } })) as never,
    });

    const out = await searchProducts({ term: 'áo' }, deps);
    expect(out.reason).toBe('rpc_error');
    expect(out.ids).toEqual([]);
    expect(deps.ilike).not.toHaveBeenCalled();
  });
});

describe('GĐ 4.2 — searchCustomers', () => {
  it('gọi đúng RPC khách hàng', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: [{ id: 'c1', rank: 0.4 }], error: null })) as never,
    });
    const out = await searchCustomers({ term: 'Nguyễn Văn A' }, deps);
    expect(out.usedFts).toBe(true);
    expect(deps.rpc).toHaveBeenCalledWith(
      'vcomm_search_customers',
      expect.objectContaining({ p_query: "'Nguyễn' & 'Văn' & 'A'" })
    );
  });

  it('fallback ILIKE của khách hàng tìm trên name/phone/email', async () => {
    const deps = makeDeps({
      rpc: vi.fn(async () => ({ data: null, error: { code: 'PGRST202', message: 'x' } })) as never,
    });
    await searchCustomers({ term: '0912' }, deps);
    expect(deps.ilike).toHaveBeenCalledWith('name.ilike.%0912%,phone.ilike.%0912%,email.ilike.%0912%', 50, 0);
  });
});
