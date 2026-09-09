// Ledger-closing fingerprint (GĐ 2.4, pattern #75).
//
// 🔴 LỖI CŨ (Finance.tsx `handlePerformClosing`): vân tay khóa sổ được tính bằng
//   `String(Math.abs(netProfit) + totalRevenue + totalExpenses)` rồi đem đi ký HSM.
//   - Cùng một tổng → CÙNG vân tay dù hai kỳ khác nhau.
//   - `Math.abs(netProfit)` xoá DẤU: lãi 100tr và lỗ 100tr cho ra MỘT vân tay.
//   → chữ ký số khóa sổ KHÔNG phát hiện được sửa sổ sau khóa (đổi lãi thành lỗ).
//
// SỬA: vân tay = SHA-256 trên chuỗi canonical GIỮ DẤU, gắn chặt kỳ + ngày chốt +
// các số liệu. Không có Web Crypto → NÉM (không trả chuỗi giả). Thuần (test được).

export interface LedgerClosingEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export interface LedgerClosingInput {
  year: number;
  month: number; // 1-12
  endOfMonthISO: string; // ISO date của cuối kỳ
  netProfit: number;
  totalRevenue: number;
  totalExpenses: number;
  entries?: LedgerClosingEntry[];
}

const MAGIC = 'VCOMM-CLOSING-v1';

/** Chuỗi canonical GIỮ DẤU, gắn kỳ + ngày chốt + đủ số liệu. Thuần, không gọi mạng. */
export function closingCanonical(input: LedgerClosingInput): string {
  const parts = [
    MAGIC,
    `period=${input.year}-${String(input.month).padStart(2, '0')}`,
    `endOfMonth=${input.endOfMonthISO}`,
    `netProfit=${Number(input.netProfit).toFixed(2)}`,
    `totalRevenue=${Number(input.totalRevenue).toFixed(2)}`,
    `totalExpenses=${Number(input.totalExpenses).toFixed(2)}`,
  ];
  if (input.entries && input.entries.length) {
    for (const e of input.entries) {
      parts.push(
        `entry:${e.accountId}:D${Number(e.debit).toFixed(2)}:C${Number(e.credit).toFixed(2)}`,
      );
    }
  }
  return parts.join('\n');
}

type SubtleLike =
  | { digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> }
  | undefined;
type CryptoLike = { subtle?: SubtleLike } | null | undefined;

/**
 * SHA-256 thật trên canonical. Thiếu Web Crypto → NÉM (không trả chuỗi giả).
 * `cryptoObj` mặc định = globalThis.crypto; truyền undefined/{} để test đường
 * thiếu crypto mà không sửa global (Node gắn crypto là getter chỉ-đọc).
 */
export async function hashLedgerClosing(
  canonical: string,
  cryptoObj: CryptoLike = (globalThis as { crypto?: CryptoLike }).crypto,
): Promise<string> {
  const subtle = cryptoObj?.subtle;
  if (!subtle || typeof subtle.digest !== 'function') {
    throw new Error('Web Crypto (crypto.subtle) không khả dụng — không thể băm khóa sổ.');
  }
  const data = new TextEncoder().encode(canonical);
  const digest = await subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
