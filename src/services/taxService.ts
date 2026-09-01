import { supabase } from '../lib/supabase';

/**
 * Tax Engine — TT 78/2021/TT-BTC (hóa đơn điện tử) + Luật Thuế GTGT
 * + NĐ 117/2025 (thuế seller — sàn không khấu trừ thay, seller tự kê)
 *
 * 1. Thuế suất cấu hình theo danh mục (category), không hardcode
 * 2. Áp dụng giảm trừ theo thời gian (VD: 2% giảm từ 1/7/2025 → 31/12/2025)
 * 3. Báo cáo thuế seller: tổng doanh thu theo kỳ cho seller tự kê khai
 *
 * Thuế suất VN hiện hành:
 * - 8%: hàng hóa thông thường (giai đoạn giảm thuế GTGT theo NĐ 72/2025 đến 31/12/2026)
 * - 10%: hàng hóa đặc thù hết ưu đãi
 * - 0%: hàng xuất khẩu, dịch vụ xuất khẩu (theo TT 219/2013)
 * - Không chịu thuế (NULL): y tế, giáo dục công, vàng miếng...
 */

export type VatRate = 0 | 0.08 | 0.1 | null;

export interface TaxRateRule {
  id: string;
  category_path: string;          // 'dien-tu' | 'thoi-trang' | '*' (default)
  vat_rate: VatRate;
  effective_from: string;         // ISO date
  effective_to: string | null;    // null = vô hạn
  legal_basis: string;            // 'NĐ 72/2025' etc.
  note: string | null;
}

/** Seed mặc định theo quy định hiện hành — import vào DB qua migration */
export const DEFAULT_TAX_RULES: Omit<TaxRateRule, 'id'>[] = [
  {
    category_path: '*',
    vat_rate: 0.08,
    effective_from: '2025-07-01',
    effective_to: '2026-12-31',
    legal_basis: 'NĐ 72/2025/NĐ-CP (giảm 2% thuế GTGT)',
    note: 'Thuế suất giảm từ 10% xuống 8% cho hầu hết hàng hóa'
  },
  {
    category_path: '*',
    vat_rate: 0.1,
    effective_from: '2027-01-01',
    effective_to: null,
    legal_basis: 'Luật Thuế GTGT — hết thời gian giảm thuế',
    note: null
  }
];

/** Cache rules in-memory 5 phút để không query DB mỗi lần tính tiền */
let rulesCache: { rules: TaxRateRule[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadRules(force = false): Promise<TaxRateRule[]> {
  if (!force && rulesCache && Date.now() - rulesCache.loadedAt < CACHE_TTL_MS) {
    return rulesCache.rules;
  }
  const { data, error } = await supabase
    .from('tax_rate_rules')
    .select('*')
    .order('effective_from', { ascending: false });
  if (error) {
    console.warn('[TaxEngine] Không tải được tax rules, dùng DEFAULT_TAX_RULES:', error.message);
    return DEFAULT_TAX_RULES.map((r, i) => ({ ...r, id: `default-${i}` })) as TaxRateRule[];
  }
  rulesCache = { rules: (data || []) as TaxRateRule[], loadedAt: Date.now() };
  return rulesCache.rules;
}

export function clearTaxRulesCache(): void {
  rulesCache = null;
}

/**
 * Tính thuế suất áp dụng cho 1 dòng hàng tại thời điểm nhất định.
 * Ưu tiên: rule match category cụ thể > rule '*' (default) — lấy rule có effective mới nhất.
 */
export function resolveVatRate(categoryPath: string, atDate: Date = new Date()): VatRate {
  // Dùng DEFAULT khi DB chưa có (không await — hàm sync cho UI tính tiền nhanh)
  const rules = (rulesCache?.rules as TaxRateRule[]) ||
    DEFAULT_TAX_RULES.map((r, i) => ({ ...r, id: `default-${i}` })) as TaxRateRule[];
  return pickRate(rules, categoryPath, atDate);
}

function pickRate(rules: TaxRateRule[], categoryPath: string, atDate: Date): VatRate {
  const iso = atDate.toISOString();
  const applicable = rules
    .filter(r => r.effective_from <= iso && (r.effective_to === null || r.effective_to >= iso))
    .filter(r => r.category_path === categoryPath || r.category_path === '*')
    // Rule category cụ thể thắng '*'; cùng loại thì lấy effective_from muộn nhất
    .sort((a, b) => {
      const aSpecific = a.category_path !== '*' ? 1 : 0;
      const bSpecific = b.category_path !== '*' ? 1 : 0;
      if (aSpecific !== bSpecific) return bSpecific - aSpecific;
      return b.effective_from.localeCompare(a.effective_from);
    });
  return applicable[0]?.vat_rate ?? 0.08; // fallback an toàn: 8% (đang giảm thuế)
}

export interface LineItemTax {
  name: string;
  price: number;
  qty: number;
  category?: string;
}

export interface OrderTaxBreakdown {
  subtotal: number;
  vatAmount: number;
  vatRate: VatRate;
  lines: Array<LineItemTax & { lineVat: number; vatRate: VatRate }>;
  legalBasis: string | null;
}

/** Tính thuế cho cả đơn — hỗ trợ thuế suất khác nhau từng dòng */
export function computeOrderTax(items: LineItemTax[], atDate: Date = new Date()): OrderTaxBreakdown {
  const lines = items.map(it => {
    const rate = resolveVatRate(it.category || '*', atDate);
    const lineSubtotal = it.price * it.qty;
    return {
      ...it,
      vatRate: rate,
      lineVat: rate === null ? 0 : Math.round(lineSubtotal * rate)
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const vatAmount = lines.reduce((s, l) => s + l.lineVat, 0);
  const primaryRate = lines.length > 0 ? lines[0].vatRate : 0.08;
  const rules = (rulesCache?.rules as TaxRateRule[]) || DEFAULT_TAX_RULES.map((r, i) => ({ ...r, id: `default-${i}` })) as TaxRateRule[];
  const basis = rules.find(r => r.vat_rate === primaryRate)?.legal_basis || null;
  return { subtotal, vatAmount, vatRate: primaryRate, lines, legalBasis: basis };
}

/**
 * NĐ 117/2025/NĐ-CP: từ 1/4/2025 sàn TMĐT KHÔNG khấu trừ thuế TNCN/TNDN thay seller.
 * Sàn chỉ cung cấp BÁO CÁO DOANH THU để seller tự kê khai.
 */
export async function generateSellerTaxReport(params: {
  sellerId: string;
  periodStart: string;  // '2026-Q1' | ISO date
  periodEnd: string;
}): Promise<{
  seller_id: string;
  period: { start: string; end: string };
  total_revenue: number;
  total_vat: number;
  order_count: number;
  generated_at: string;
  note: string;
}> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, vat_amount, status, created_at')
    .eq('seller_id', params.sellerId)
    .in('status', ['delivered', 'completed'])
    .gte('created_at', params.periodStart)
    .lte('created_at', params.periodEnd);

  if (error) throw new Error(`Tạo báo cáo thuế seller lỗi: ${error.message}`);

  const rows = (orders || []) as any[];
  const totalRevenue = rows.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalVat = rows.reduce((s, o) => s + Number(o.vat_amount || 0), 0);

  return {
    seller_id: params.sellerId,
    period: { start: params.periodStart, end: params.periodEnd },
    total_revenue: totalRevenue,
    total_vat: totalVat,
    order_count: rows.length,
    generated_at: new Date().toISOString(),
    note: 'Theo NĐ 117/2025/NĐ-CP: Sàn TMĐT không khấu trừ thuế TNDN/TNCN thay thế. ' +
      'Báo cáo này cung cấp cho nhà bán hàng tự kê khai thuế với cơ quan thuế. ' +
      'Vui lòng đối chiếu với sổ kế toán TT 99/2025/TT-BTC của công ty.'
  };
}
