/**
 * ============================================================================
 *  src/lib/aiResult.ts — Phân biệt kết quả AI THẬT và nội dung MẪU (GĐ 2.4)
 * ============================================================================
 *
 *  🔴 LỖI CŨ: khi thiếu `GEMINI_API_KEY` (hoặc bị rate limit), server KHÔNG
 *  báo lỗi mà rơi vào nhánh fallback sinh sẵn — `res.json({ text, simulated:
 *  true })`. Client chỉ đọc `data.text` rồi thông báo "Pháp chế VComm đã hoàn
 *  tất thẩm định tính tuân thủ cho hồ sơ X". Nghĩa là: **một bản thẩm định
 *  pháp lý GIẢ được trình bày như kết quả AI thật**, người duyệt có thể ký
 *  duyệt hồ sơ dựa trên nội dung không ai phân tích. Cùng một lỗi với việc
 *  stub MISA tự bịa `MISA-VC-######` (AUDIT_PATTERNS #50).
 *
 *  SỬA: cờ `simulated` (và `rateLimited`) được đưa thẳng vào nội dung hiển
 *  thị. Không xoá kết quả mẫu (vẫn hữu ích để demo/offline), nhưng người dùng
 *  PHẢI nhìn thấy ngay đó là mẫu.
 *
 *  ⚠️ Quy ước: thiếu cờ `simulated` (response của các endpoint khác như
 *  vector-search không có cờ) → coi là kết quả thật, KHÔNG thêm banner. Vì
 *  vậy mọi endpoint có nhánh fallback bắt buộc phải trả `simulated: true`.
 * ============================================================================
 */

/** Banner cảnh báo, đặt TRƯỚC nội dung khi kết quả không phải do AI thật sinh ra. */
export const SIMULATED_AI_BANNER =
  '⚠️ KẾT QUẢ MẪU — KHÔNG PHẢI phân tích AI thật. Máy chủ chưa cấu hình GEMINI_API_KEY hoặc đang bị giới hạn tốc độ; nội dung dưới đây được sinh theo mẫu. KHÔNG dùng để phê duyệt hay ký duyệt hồ sơ.';

/** `true` khi payload đánh dấu đây là nội dung mẫu (simulated hoặc rateLimited). */
export function isSimulatedAiResult(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return p.simulated === true || p.rateLimited === true;
}

/**
 * Ghép banner vào trước nội dung nếu là kết quả mẫu; kết quả thật giữ nguyên.
 * - `text` rỗng → trả nguyên (không bao giờ hiện banner trơ trọi).
 * - Không ném, không gọi mạng — thuần, test được.
 */
export function withSimulatedBanner(text: string, payload: unknown): string {
  if (!text) return text;
  return isSimulatedAiResult(payload) ? `${SIMULATED_AI_BANNER}\n\n${text}` : text;
}

/**
 * Banner riêng cho nội dung SOẠN SẴN NGAY TRONG MÀN HÌNH — tệ hơn cả kết quả
 * mẫu trả từ server, vì ở đây hoàn toàn KHÔNG CÓ lời gọi AI nào: văn bản là hằng
 * số cố định, chỉ ghép vài con số vào (Finance → "Phân tích dòng tiền bằng AI",
 * nút bấm xong hiện ngay một đoạn đã viết sẵn từ trước).
 *
 * Dùng `SIMULATED_AI_BANNER` cho nhánh fallback từ server (có gọi nhưng bị rớt
 * về mẫu); dùng banner này khi mã nguồn tự bịa mà chưa từng gọi mô hình.
 */
export const CANNED_ANALYSIS_BANNER =
  '⚠️ NỘI DUNG SOẠN SẴN — KHÔNG PHẢI phân tích AI. Chức năng này chưa được nối mô hình ngôn ngữ: văn bản dưới đây là một mẫu cố định viết sẵn trong mã nguồn, chỉ ghép thêm vài số liệu của kỳ hiện tại. KHÔNG dùng làm căn cứ quyết định tài chính.';

/** Ghép banner "soạn sẵn" vào trước nội dung. `text` rỗng → trả nguyên. */
export function withCannedBanner(text: string): string {
  if (!text) return text;
  return `${CANNED_ANALYSIS_BANNER}\n\n${text}`;
}
