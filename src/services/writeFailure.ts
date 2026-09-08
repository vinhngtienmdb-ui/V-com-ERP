/**
 * Báo lỗi ghi dữ liệu — dùng chung cho các màn hình hay gặp cảnh "ghi lỗi mà vẫn
 * giả vờ xong" (AUDIT_PATTERNS #74).
 *
 * ⭐ BUG GỐC (DeviceLeasing ×4): mọi `catch(err)` đều ÂM THẦM sửa state local:
 *   · `handleUpdateStatus`        — không log, không báo.
 *   · `handleCollectInstallment`  — không log, không báo, mà lịch sử vẫn ghi
 *     "Đã thu số tiền … thành công".
 *   · Knox toggle                 — không log, không báo.
 *   · `handleCreateApplication`   — log xong vẫn tự bịa một bản ghi local mang
 *     id `l-manual-…` (id này KHÔNG tồn tại trong DB) rồi đóng modal.
 *
 *  Vì danh sách được `onSnapshot` lái, bản sửa local đó sẽ bị ghi đè sau vài giây
 *  — nhưng operator (và khách đứng đối diện) thì KHÔNG BAO GIỜ được biết rằng
 *  thao tác vừa thất bại. Với "thu tiền" đó là chuyện nghiêm trọng: thu ngân báo
 *  khách đã đóng tiền trong khi DB vẫn ghi chưa đóng.
 */

/** Rút thông điệp lỗi từ đủ loại: Error, chuỗi, object có `message`, unknown. */
function extractErrorMessage(error: unknown): string {
  if (error === null || error === undefined) return '';
  if (typeof error === 'string') return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (typeof error === 'object') {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim() !== '') return m.trim();
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim() !== '') return code.trim();
  }
  return String(error).trim();
}

/**
 * Câu thông báo tiếng Việt, nói rõ là CHƯA được lưu.
 * Không bao giờ được chứa chữ "thành công".
 */
export function describeWriteFailure(context: unknown, error?: unknown): string {
  const what =
    typeof context === 'string' && context.trim() !== '' ? context.trim() : 'dữ liệu';

  const raw = extractErrorMessage(error);
  // Cắt bớt tin nhắn lỗi của thư viện — thường rất dài và không giúp ích gì.
  const detail = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;

  return (
    `Không ghi được ${what} xuống cơ sở dữ liệu — thao tác CHƯA được lưu. ` +
    `Vui lòng thử lại.${detail ? ` (${detail})` : ''}`
  );
}

/** `console.error` + trả về thông báo để component `alert()`. */
export function reportWriteFailure(context: unknown, error?: unknown): string {
  const message = describeWriteFailure(context, error);
  console.error(`[writeFailure] ${message}`, error ?? '');
  return message;
}
