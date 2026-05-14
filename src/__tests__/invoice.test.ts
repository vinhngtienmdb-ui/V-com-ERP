import { describe, it, expect } from 'vitest';

/**
 * Logic test cho issueInvoice (Cloud Function functions/src/invoiceHandlers.ts).
 * Bóc tách các pure function để test độc lập, không cần Firestore.
 */

const VAT_RATE_DEFAULT = 0.1;

// Pure: tính line items (mirror exact code trong invoiceHandlers.ts)
function buildLineItems(orderItems: { productId: string; productName: string; quantity: number; price: number }[]) {
  return orderItems.map((it) => {
    const amount = it.price * it.quantity;
    const vatAmount = Math.round(amount * VAT_RATE_DEFAULT);
    return {
      productCode: it.productId,
      description: it.productName ?? 'N/A',
      unit: 'cái',
      quantity: it.quantity,
      unitPrice: it.price,
      vatRate: VAT_RATE_DEFAULT,
      amount,
      vatAmount,
    };
  });
}

function aggregateInvoice(items: ReturnType<typeof buildLineItems>) {
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const vatTotal = items.reduce((s, it) => s + it.vatAmount, 0);
  const total = subtotal + vatTotal;
  return { subtotal, vatTotal, total };
}

// Pure: validate điều kiện xuất HĐ
function canIssueInvoice(order: { status: string }) {
  return order.status === 'delivered' || order.status === 'completed';
}

// Pure: format số HĐ
function formatInvoiceNumber(seq: number, year: number) {
  return {
    number: String(seq).padStart(7, '0'),
    serial: `K${String(year).slice(-2)}TVC`,
    id: `INV_${year}_${String(seq).padStart(7, '0')}`,
  };
}

describe('Invoice — line item calculation', () => {
  it('VAT 10% cho 1 item đơn giản', () => {
    const items = buildLineItems([
      { productId: 'P1', productName: 'SP1', quantity: 2, price: 500000 },
    ]);
    expect(items[0].amount).toBe(1000000);
    expect(items[0].vatAmount).toBe(100000);
    expect(items[0].vatRate).toBe(0.1);
  });

  it('Aggregate 3 items', () => {
    const items = buildLineItems([
      { productId: 'P1', productName: 'SP1', quantity: 2, price: 500000 }, // 1.000.000 + VAT 100.000
      { productId: 'P2', productName: 'SP2', quantity: 1, price: 1500000 }, // 1.500.000 + VAT 150.000
      { productId: 'P3', productName: 'SP3', quantity: 3, price: 200000 }, // 600.000 + VAT 60.000
    ]);
    const agg = aggregateInvoice(items);
    expect(agg.subtotal).toBe(3100000);
    expect(agg.vatTotal).toBe(310000);
    expect(agg.total).toBe(3410000);
  });

  it('Round VAT đúng theo Math.round (33.333 → 33333)', () => {
    const items = buildLineItems([
      { productId: 'P1', productName: 'SP1', quantity: 1, price: 333333 }, // VAT = 33333.3 → round 33333
    ]);
    expect(items[0].vatAmount).toBe(33333);
  });
});

describe('Invoice — eligibility', () => {
  it('Cho phép xuất HĐ cho đơn delivered', () => {
    expect(canIssueInvoice({ status: 'delivered' })).toBe(true);
  });

  it('Cho phép xuất HĐ cho đơn completed', () => {
    expect(canIssueInvoice({ status: 'completed' })).toBe(true);
  });

  it('Không cho xuất HĐ cho đơn pending', () => {
    expect(canIssueInvoice({ status: 'pending' })).toBe(false);
  });

  it('Không cho xuất HĐ cho đơn processing', () => {
    expect(canIssueInvoice({ status: 'processing' })).toBe(false);
  });

  it('Không cho xuất HĐ cho đơn cancelled', () => {
    expect(canIssueInvoice({ status: 'cancelled' })).toBe(false);
  });
});

describe('Invoice — number formatting', () => {
  it('Pad số HĐ thành 7 chữ số', () => {
    const r = formatInvoiceNumber(1, 2026);
    expect(r.number).toBe('0000001');
    expect(r.serial).toBe('K26TVC');
    expect(r.id).toBe('INV_2026_0000001');
  });

  it('Số HĐ lớn không truncate', () => {
    const r = formatInvoiceNumber(123456, 2026);
    expect(r.number).toBe('0123456');
  });

  it('Năm 2030 serial K30TVC', () => {
    const r = formatInvoiceNumber(99, 2030);
    expect(r.serial).toBe('K30TVC');
  });
});

describe('Seller tax aggregation (NĐ 117/2025)', () => {
  // 1.5% TT 40/2021 = 1% VAT + 0.5% TNCN cho cá nhân KD TMĐT
  const PERSONAL_SELLER_TAX_RATE = 0.015;

  function estimatedTax(netRevenue: number, entityType: string) {
    return entityType === 'individual' ? Math.round(netRevenue * PERSONAL_SELLER_TAX_RATE) : 0;
  }

  it('Cá nhân doanh thu 100tr → thuế ước tính 1.5tr', () => {
    expect(estimatedTax(100000000, 'individual')).toBe(1500000);
  });

  it('Hộ kinh doanh tự khai (rate=0)', () => {
    expect(estimatedTax(100000000, 'household')).toBe(0);
  });

  it('Doanh nghiệp tự khai (rate=0)', () => {
    expect(estimatedTax(100000000, 'company')).toBe(0);
  });
});
