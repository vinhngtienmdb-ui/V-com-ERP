-- 015: Bổ sung cột xử lý sai sót HĐĐT theo TT 91/2026 Điều 10 (S2')
-- Thay thế khái niệm "hủy" (TT 78 Điều 19) bằng 4 luồng:
--   announce_adjust | replace | monthly_consolidate
-- Lưu vết luồng xử lý + liên kết thay thế + bảng kê gộp tháng.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS einvoice_error_flow TEXT
    CHECK (einvoice_error_flow IN ('announce_adjust', 'replace', 'monthly_consolidate')),
  ADD COLUMN IF NOT EXISTS einvoice_error_reason TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_replaces_invoice_no TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_adjusted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS einvoice_consolidation_ref TEXT,
  ADD COLUMN IF NOT EXISTS einvoice_error_handled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.einvoice_error_flow IS
  'TT 91/2026 Điều 10: announce_adjust (Mẫu 04/SS-HĐĐT + điều chỉnh) | replace (thay thế) | monthly_consolidate (Mẫu 01/BK-ĐCTT). KHÔNG có "hủy".';
COMMENT ON COLUMN public.orders.einvoice_replaces_invoice_no IS
  'Số HĐ gốc khi luồng "replace" — HĐ gốc chuyển sang trạng thái replaced.';
COMMENT ON COLUMN public.orders.einvoice_consolidation_ref IS
  'Mã bảng kê Mẫu 01/BK-ĐCTT khi gộp tháng các HĐ máy tính tiền.';
