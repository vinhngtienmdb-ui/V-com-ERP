/**
 * ============================================================================
 *  searchQuery.ts — GĐ 4.2: tìm kiếm toàn văn tiếng Việt (an toàn)
 * ============================================================================
 *
 *  Lỗ hổng hạ tầng (spec 022): VComm KHÔNG có full-text search. Người dùng tìm
 *  "áo thun" không khớp "ao thun" hay "ÁO THUN" vì Postgres không bỏ dấu tiếng Việt
 *  theo mặc định, và `ILIKE '%...%'` thì quét toàn bảng (chậm, không có index).
 *
 *  Giải pháp: Postgres FTS + extension `unaccent` + cột `search_vector` (tsvector)
 *  có GIN index (xem migration SQL đi kèm). Module này lo phần NGUY HIỂM NHẤT:
 *
 *  🔴 BẢO MẬT — `to_tsquery` KHÔNG THỂ THAM SỐ HÓA:
 *     Chuỗi truyền vào là CÚ PHÁP (syntax), không phải dữ liệu. Nếu nối thô input
 *     người dùng, họ có thể chèn toán tử (& | ! ( ) : *) để đổi ngữ nghĩa truy vấn,
 *     hoặc gây lỗi cú pháp 500. Vì vậy MỌI token phải được ESCAPE và bọc trong
 *     nháy đơn trước khi ghép toán tử. Module này là nơi duy nhất làm việc đó.
 *
 *  Cách hoạt động với tiếng Việt:
 *   - Client chỉ gửi từ khoá ĐÃ ESCAPE (chuỗi tsquery an toàn).
 *   - Phía DB, cột search_vector được tạo bằng `to_tsvector('simple', unaccent(...))`
 *     nên "áo thun" và "ao thun" cho cùng lexeme → tìm được cả hai.
 *   - Dùng dictionary 'simple' (không stemmer) vì tiếng Việt không có stemmer chuẩn
 *     trong Postgres; đổi sang 'vietnamese' nếu sau này cài được.
 * ============================================================================
 */

export type SearchMode = 'and' | 'or' | 'prefix';

export interface BuildTsQueryOptions {
  /** 'and' (tất cả từ) · 'or' (bất kỳ từ) · 'prefix' (từ cuối dạng tiền tố). Mặc định 'and'. */
  mode?: SearchMode;
  /** Giới hạn số token để tránh truy vấn khổng lồ. Mặc định 10. */
  maxTokens?: number;
}

/**
 * Escape một token để dùng an toàn trong to_tsquery.
 *  - Thoát backslash và nháy đơn.
 *  - Bọc trong nháy đơn → mọi toán tử (& | ! ( ) : *) trở thành ký tự thường.
 *
 * Ví dụ: `a'b` → `'a''b'` · `x&y` → `'x&y'` (không còn là toán tử AND).
 */
export function escapeTsQueryLiteral(token: string): string {
  const escaped = token.replace(/\\/g, '\\\\').replace(/'/g, "''");
  return `'${escaped}'`;
}

/**
 * Tách input thành token: bỏ khoảng trắng thừa, loại token rỗng.
 * Giữ NGUYÊN dấu tiếng Việt (việc bỏ dấu do `unaccent` phía DB đảm nhiệm).
 */
export function tokenize(input: string): string[] {
  return input
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Dựng chuỗi tsquery AN TOÀN từ input người dùng.
 *
 *  - 'and'    : 'áo' & 'thun'          (mặc định)
 *  - 'or'     : 'áo' | 'thun'
 *  - 'prefix' : 'áo' & 'thun':*        (gõ tiếp — từ cuối là tiền tố)
 *
 * @returns chuỗi tsquery, hoặc '' nếu input rỗng (caller nên bỏ qua tìm kiếm).
 */
export function buildTsQuery(input: string, opts: BuildTsQueryOptions = {}): string {
  const mode = opts.mode ?? 'and';
  const maxTokens = opts.maxTokens ?? 10;

  const tokens = tokenize(input);
  if (tokens.length === 0) return '';

  const limited = tokens.slice(0, maxTokens);
  const parts = limited.map(escapeTsQueryLiteral);

  if (mode === 'prefix') {
    // Chỉ từ CUỐI được ghép :* (tiền tố) — các từ trước khớp chính xác.
    parts[parts.length - 1] = `${parts[parts.length - 1]}:*`;
    return parts.join(' & ');
  }

  const op = mode === 'or' ? ' | ' : ' & ';
  return parts.join(op);
}

/**
 * Tiện ích: có nên chạy tìm kiếm không (input quá ngắn/ rỗng).
 * Tránh gửi truy vấn vô nghĩa xuống DB.
 */
export function isSearchable(input: string, minLength = 1): boolean {
  return tokenize(input).length > 0 && input.trim().length >= minLength;
}
