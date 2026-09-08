import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Hồi quy (GĐ 2.4 / pattern #74): RequestHub từng "ghi lỗi DB mà vẫn giả vờ xong".
 * Ba handler — executeRouting, handleStatusChange, executeSignature — đều:
 *   1. sửa state local LẠC QUAN rồi nuốt lỗi Firestore (`console.error` thầm),
 *   2. báo "thành công" dù write thất bại (executeRouting: "Luân chuyển thành công"
 *      được addNotification vô điều kiện ngay sau một `.catch` nuốt lỗi).
 * Sửa đúng: ghi DB TRƯỚC (await), chỉ báo thành công SAU khi ghi xong, và báo lỗi
 * qua `reportWriteFailure` khi write hỏng. onSnapshot sẽ đồng bộ state từ Firestore.
 *
 * Test quét NGUỒN (readFileSync) — không thể chứng minh bằng component render,
 * nhưng chặn tái phạm chính xác pattern "nuốt lỗi + giả thành công".
 */
const src = readFileSync(
  join(__dirname, 'components', 'RequestHub.tsx'),
  'utf-8'
).replace(/\r/g, '');

describe('RequestHub — ghi DB lỗi phải BÁO, không được giả xong (pattern #74)', () => {
  it('gọi reportWriteFailure ở mọi chỗ ghi requests thất bại (≥3 handler)', () => {
    const n = (src.match(/reportWriteFailure\(/g) || []).length;
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it('handleStatusChange đã là async (await được DB write)', () => {
    expect(src).toContain(
      'const handleStatusChange = async (id: string, newStatus: string) => {'
    );
  });

  it('KHÔNG còn báo "Luân chuyển thành công" vô điều kiện sau write', () => {
    // Bản cũ gọi addNotification('Luân chuyển thành công', ...) ngay sau .catch nuốt lỗi.
    expect(src).not.toContain("addNotification(\n        'Luân chuyển thành công'");
    expect(src).not.toContain("addNotification('Luân chuyển thành công'");
  });

  it('KHÔNG còn nuốt lỗi Firestore bằng console.error đơn thuần', () => {
    expect(src).not.toContain("console.error('Failed to update routed request in DB:'");
    expect(src).not.toContain("console.error('RequestHub status update error:'");
  });

  it('executeRouting ghi DB trước, không tự sửa state local giả vờ xong', () => {
    // Đã bỏ optimistic setRequests(prevRequests => ...) cho luân chuyển.
    expect(src).not.toContain('setRequests(prevRequests => prevRequests.map(req =>');
    // Và dùng await updateDoc thay vì fire-and-forget .catch nuốt lỗi.
    expect(src).toContain(
      "await updateDoc(doc(db, 'requests', routingRequest.id), {"
    );
  });

  it('executeSignature chỉ báo "Ký số thành công" sau khi ghi DB xong', () => {
    // Không còn sửa setRequests/selectedRequestForView/ForPrint optimistic trước write.
    expect(src).not.toContain(
      'setRequests(prev => prev.map(req =>\n        req.id === signingRequestId'
    );
    // Báo thất bại (qua reportWriteFailure) khi write hỏng, thay vì giả ký xong.
    expect(src).toContain('reportWriteFailure(`ký số đề xuất ${signingRequestId}`');
  });
});
