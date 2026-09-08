/**
 * GĐ 2.4 — Header xác thực cho mọi lời gọi lên server proxy.
 *
 * Từ đợt này hầu hết route `/api/**` đều gắn `requireAuth`: client không gửi
 * kèm token phiên sẽ nhận 401. Helper này là chỗ lấy token DUY NHẤT để các
 * service không mỗi nơi tự chế một kiểu.
 *
 * ⚠️ VÌ SAO IMPORT LAZY: `lib/supabase` đọc cấu hình env để tạo client. Import
 * TĨNH từ một service khiến module đó (và mọi test của nó) kéo theo cấu hình
 * env ngay khi được nạp — đã từng làm test chạy trong môi trường trống env bị
 * nổ ở thì import (xem `sepayService.authHeaders`). Import động chỉ chạy khi
 * thật sự chuẩn bị gọi mạng.
 *
 * Fail-closed ở phía SERVER: trả object rỗng khi lấy phiên lỗi, server sẽ trả
 * 401 — thay vì ném lỗi làm vỡ màn hình chỉ vì không đọc được phiên.
 */
export async function sessionAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { getSupabaseAuthHeaders } = await import('./supabase');
    return await getSupabaseAuthHeaders();
  } catch {
    return {};
  }
}
