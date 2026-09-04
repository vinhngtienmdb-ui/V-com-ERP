/**
 * ============================================================================
 *  einvoiceTax.ts — #21: thuế trên HĐ ủy nhiệm (TT 91/2026 Điều 9.1.h)
 * ============================================================================
 *
 *  Phát hiện then chốt: khi VComm **ủy nhiệm** xuất HĐ thay Seller, hóa đơn đó
 *  là hóa đơn **CỦA SELLER**. Thuế suất/phương pháp tính thuế trên HĐ phải là
 *  của Seller, KHÔNG dùng biểu thuế (tax_rate_rules) của VComm. Nếu chỉ thêm cột
 *  `tax_method` mà không sửa đường tính thuế → HĐ VẪN SAI.
 *
 *  Hai phương pháp (TT 91 Điều 9.1.h + NĐ 252/2026):
 *   - 'declaration' (kê khai/khấu trừ): thuế suất GTGT theo luật & mặt hàng
 *     (8%/10% — căn cứ NĐ 174/2025, không phải NĐ 72/2025). Dùng mẫu 1 (HĐ GTGT).
 *   - 'presumptive' (khoán/trực tiếp): thuế = doanh thu × tỷ lệ %. HĐ KHÔNG tách
 *     dòng VAT, giá đã bao gồm thuế. Dùng mẫu 2 (HĐ bán hàng).
 *
 *  Mọi hàm ở đây là THUẦN (không chạm DB) để dễ test và tái dùng ở cả luồng
 *  online (platform) lẫn offline (hub_pos).
 * ============================================================================
 */

import { computeOrderTax, LineItemTax } from './taxService';

export type TaxMethod = 'declaration' | 'presumptive' | 'not_applicable';
export type InvoiceChannel = 'platform' | 'hub_pos';
export type InvoiceFormNo = '1' | '2' | '6' | '7';

export interface DelegationContext {
  delegationId: string;
  /** NGƯỜI BÁN = bên ủy nhiệm (Seller) — TT 91 Điều 9.1.d */
  seller: { name: string; taxCode: string; address: string };
  /** Phương pháp tính thuế tại ngày lập HĐ — TT 91 Điều 9.1.h */
  taxMethod: TaxMethod;
  presumptiveVatRatio?: number; // chỉ khi 'presumptive'
  presumptivePitRatio?: number; // chỉ khi 'presumptive'
  /** Mẫu số ưu tiên của Seller (ủy nhiệm). Mặc định '1' (kê khai) / '2' (khoán). */
  formNo?: InvoiceFormNo;
}

/**
 * Chiến lược sinh ký hiệu Mẫu 7 cho luồng ủy nhiệm trên sàn (spec 030 #28):
 *  - 'seller_form' (MẶC ĐỊNH, Model B — đọc đúng TT 91 Điều 9.1.h): HĐ ủy nhiệm dùng
 *    M�u số CỦA SELLER (kê khai→1, khoán→2, ký tự T). Không phát sinh Mẫu 7 thứ hai.
 *  - 'platform_7' (Model A — CQT chấp nhận sàn gộp ủy nhiệm vào Mẫu 7 của VComm):
 *    cả tự bán và ủy nhiệm đều Mẫu 7 (ký tự X); phân biệt bằng 2 ký tự cuối:
 *    `XAB` = VComm tự bán, `XAC` = VComm ủy nhiệm lập thay Seller.
 * ⚠️ Model A cần xác nhận CQT (#26). Mặc định an toàn = 'seller_form'.
 */
export type InvoiceSymbolStrategy = 'seller_form' | 'platform_7';

export interface InvoiceShape {
  formNo: InvoiceFormNo;
  symbol: string;
}

/**
 * Giải mã mẫu số + ký hiệu 6 ký tự theo Phụ lục I TT 91/2026.
 *  - Mặc định (Model B, 'seller_form'): có ủy nhiệm → mẫu số khớp phương pháp của
 *    Seller (kê khai→1, khoán→2, ký tự T); không ủy nhiệm → VComm tự bán (platform→7,
 *    hub_pos→1). Ký tự đầu luôn 'K' (KHÔNG MÃ) để được phép offline (ND 254 Điều 14.4/14.5).
 *  - Tùy chọn (Model A, 'platform_7', CẦN CQT duyệt #26): ủy nhiệm gộp vào Mẫu 7 của
 *    VComm, hậu tố XAC (ủy nhiệm) / XAB (tự bán) — xem spec 030 #28.
 */
export function resolveInvoiceShape(input: {
  channel: InvoiceChannel;
  delegation?: DelegationContext;
  issueDate: Date;
  /** Xem InvoiceSymbolStrategy. Mặc định 'seller_form' (Model B, an toàn TT 91 Điều 9.1.h). */
  symbolStrategy?: InvoiceSymbolStrategy;
}): InvoiceShape {
  const yy = String(input.issueDate.getUTCFullYear()).slice(-2);
  const d = input.delegation;
  const strategy: InvoiceSymbolStrategy = input.symbolStrategy ?? 'seller_form';

  if (d) {
    if (strategy === 'platform_7') {
      // Model A: ủy nhiệm gộp vào Mẫu 7 của VComm, hậu tố XAC (spec 030 #28).
      return { formNo: '7', symbol: `7K${yy}XAC` };
    }
    // Model B (mặc định): HĐ ủy nhiệm = Mẫu số của Seller (kê khai→1, khoán→2).
    const formNo: InvoiceFormNo = d.formNo ?? (d.taxMethod === 'presumptive' ? '2' : '1');
    const typeChar = formNo === '7' ? 'X' : 'T';
    return { formNo, symbol: `${formNo}K${yy}${typeChar}YY` };
  }

  // Không ủy nhiệm: VComm tự bán.
  if (input.channel === 'platform') {
    const suffix = strategy === 'platform_7' ? 'XAB' : 'XYY'; // #28: XAB = tự bán
    return { formNo: '7', symbol: `7K${yy}${suffix}` };
  }
  return { formNo: '1', symbol: `1K${yy}TYY` }; // Bán tại trạm = HĐ GTGT thường
}

export interface DelegatedTaxResult {
  method: TaxMethod;
  subtotal: number;
  vatAmount: number;
  pitAmount: number;
  total: number;
  /** true = HĐ bán hàng (khoán), KHÔNG tách dòng VAT. */
  isPresumptive: boolean;
  lines?: Array<LineItemTax & { lineVat: number; vatRate: number }>;
  legalBasis: string;
}

/**
 * Tính thuế cho HĐ ủy nhiệm theo phương pháp của Seller.
 *  - declaration: dùng computeOrderTax (biểu GTGT của VComm, giống luật).
 *  - presumptive: doanh thu × tỷ lệ. Không tách dòng VAT; total = subtotal
 *    (đã bao gồm thuế theo quy định khoán).
 */
export function computeDelegatedOrderTax(
  items: LineItemTax[],
  seller: { taxMethod: TaxMethod; presumptiveVatRatio?: number; presumptivePitRatio?: number },
): DelegatedTaxResult {
  const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);

  if (seller.taxMethod === 'presumptive') {
    const vatRatio = seller.presumptiveVatRatio ?? 0.01; // bán lẻ GTGT mặc định 1%
    const pitRatio = seller.presumptivePitRatio ?? 0.005; // bán lẻ TNCN mặc định 0,5%
    const vatAmount = round2(subtotal * vatRatio);
    const pitAmount = round2(subtotal * pitRatio);
    return {
      method: 'presumptive',
      subtotal: round2(subtotal),
      vatAmount,
      pitAmount,
      total: round2(subtotal), // giá khoán đã bao gồm thuế
      isPresumptive: true,
      legalBasis: 'NĐ 252/2026/NĐ-CP (khoán/trực tiếp) + TT 91/2026 Điều 9.1.h',
    };
  }

  // declaration (kê khai/khấu trừ) — thuế GTGT từng dòng như luật
  const breakdown = computeOrderTax(items);
  return {
    method: 'declaration',
    subtotal: round2(breakdown.subtotal),
    vatAmount: round2(breakdown.vatAmount),
    pitAmount: 0,
    total: round2(breakdown.subtotal + breakdown.vatAmount),
    isPresumptive: false,
    lines: breakdown.lines.map((l) => ({
      ...l,
      lineVat: round2(l.lineVat),
      vatRate: typeof l.vatRate === 'number' ? l.vatRate : ((l.vatRate as { rate: number })?.rate ?? 0.1),
    })),
    legalBasis: 'Luật Thuế GTGT + NĐ 174/2025/NĐ-CP (8%/10%) + TT 91/2026 Điều 9.1.h',
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Gate phát hành HĐ ủy nhiệm: BẮT BUỘC có phương pháp tính thuế của Seller
 * tại thời điểm lập (TT 91 Điều 9.1.h). Thiếu → ném lỗi, từ chối phát hành.
 * Dùng chung với validateDelegationForIssue (Điều 9.1.đ) ở S3.
 */
export function assertSellerTaxMethodForIssue(
  delegation: { id?: string; status?: string },
  sellerTaxMethod: TaxMethod | null | undefined,
): void {
  if (!sellerTaxMethod || sellerTaxMethod === 'not_applicable') {
    throw new Error(
      `Không thể phát hành HĐ ủy nhiệm (delegation ${delegation.id}): Seller CHƯA khai ` +
      `báo phương pháp tính thuế (tax_method). TT 91/2026 Điều 9.1.h bắt buộc HĐ khớp ` +
      `phương pháp tính thuế của bên ủy nhiệm. Cập nhật seller_tax_methods trước khi lập HĐ.`,
    );
  }
}
