import { describe, it, expect } from 'vitest';
import { buildTsQuery, escapeTsQueryLiteral, tokenize, isSearchable } from './searchQuery';

describe('GĐ 4.2 — buildTsQuery (FTS tiếng Việt, an toàn)', () => {
  it('từ đơn → literal trong nháy đơn', () => {
    expect(buildTsQuery('áo')).toBe("'áo'");
  });

  it('nhiều từ mặc định AND', () => {
    expect(buildTsQuery('áo thun')).toBe("'áo' & 'thun'");
  });

  it('mode or → toán tử |', () => {
    expect(buildTsQuery('áo thun', { mode: 'or' })).toBe("'áo' | 'thun'");
  });

  it('mode prefix → từ cuối có :*', () => {
    expect(buildTsQuery('áo thu', { mode: 'prefix' })).toBe("'áo' & 'thu':*");
  });

  it('bỏ qua khoảng trắng thừa / token rỗng', () => {
    expect(buildTsQuery('  áo   thun  ')).toBe("'áo' & 'thun'");
    expect(buildTsQuery('   ')).toBe('');
  });

  it('giới hạn số token (mặc định 10)', () => {
    const q = buildTsQuery('a b c d e f g h i j k l m');
    expect(q.split(' & ').length).toBe(10);
  });

  it('maxTokens có thể ghi đè', () => {
    const q = buildTsQuery('a b c d', { maxTokens: 2 });
    expect(q).toBe("'a' & 'b'");
  });

  it('giữ NGUYÊN dấu tiếng Việt (bỏ dấu do unaccent phía DB)', () => {
    expect(buildTsQuery('Hà Nội')).toBe("'Hà' & 'Nội'");
  });
});

describe('GĐ 4.2 — BẢO MẬT: escape to_tsquery', () => {
  it('toán tử & | ! không còn là toán tử', () => {
    // Nếu không escape, "áo&thun" bị hiểu là AND; escape → tìm literal "áo&thun"
    expect(buildTsQuery('áo&thun')).toBe("'áo&thun'");
  });

  it('nháy đơn được thoát (chống phá chuỗi)', () => {
    expect(escapeTsQueryLiteral("a'b")).toBe("'a''b'");
  });

  it('backslash được thoát', () => {
    expect(escapeTsQueryLiteral('a\\b')).toBe("'a\\\\b'");
  });

  it('đầu vào kiểu SQL injection bị vô hiệu hoá (mỗi token nằm trọn trong literal)', () => {
    const q = buildTsQuery("'; DROP TABLE products; --");
    // Input bị TÁCH thành từng token, mỗi token được escape + bọc nháy độc lập:
    //   ''';' & 'DROP' & 'TABLE' & 'products;' & '--'
    // → "DROP TABLE" không còn đứng liền nhau thành câu lệnh; toàn bộ chỉ là TEXT tìm kiếm.
    expect(q).not.toContain('DROP TABLE');
    expect(q.startsWith("'")).toBe(true);
    expect(q.endsWith("'")).toBe(true);
    // Mọi toán tử FTS đều bị vô hiệu: NGOÀI nháy CHỈ còn toán tử ghép do CHÚNG TA chủ động thêm.
    // Không cho phép ! : ( ) * hay bất kỳ toán tử nào khác lọt ra ngoài literal.
    const outsideQuotes = q.replace(/'(?:[^']|'')*'/g, '');
    expect(outsideQuotes).toMatch(/^\s*(\s[&|]\s\s*)*$/); // chỉ gồm ' & ' / ' | '
    expect(outsideQuotes).not.toMatch(/[!():*<>-]/);
  });

  it('mọi token đều nằm trong nháy (không còn ký tự trần)', () => {
    const q = buildTsQuery('a b c', { mode: 'or' });
    const outsideQuotes = q.replace(/'(?:[^']|'')*'/g, '');
    // chỉ còn toán tử ghép do CHÚNG TA chủ động thêm, không phải từ input
    expect(outsideQuotes).toBe(' |  | ');
  });

  it('ngoặc đơn / dấu hai chấm / dấu sao bị vô hiệu hoá', () => {
    expect(buildTsQuery('(a:b*)')).toBe("'(a:b*)'");
  });

  it('input rỗng → chuỗi rỗng, không sinh tsquery lỗi', () => {
    expect(buildTsQuery('')).toBe('');
    expect(buildTsQuery('   ')).toBe('');
  });
});

describe('GĐ 4.2 — tokenize & isSearchable', () => {
  it('tokenize tách theo khoảng trắng, bỏ token rỗng', () => {
    expect(tokenize('  áo   thun ')).toEqual(['áo', 'thun']);
    expect(tokenize('')).toEqual([]);
  });

  it('isSearchable: rỗng/khoảng trắng → false', () => {
    expect(isSearchable('')).toBe(false);
    expect(isSearchable('   ')).toBe(false);
    expect(isSearchable('áo')).toBe(true);
  });

  it('isSearchable tôn trọng minLength', () => {
    expect(isSearchable('a', 2)).toBe(false);
    expect(isSearchable('ab', 2)).toBe(true);
  });
});
