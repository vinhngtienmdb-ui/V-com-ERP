import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Hồi quy (GĐ 2.4 / pattern #70 + #74): HR.handleSaveEmployee từng alert
 * "Đã cập nhật/thêm mới nhân viên thành công!" VÔ ĐIỀU KIỆN, dù
 * `syncToSupabaseEmployees` chỉ upsert 5 trường và NUỐT lỗi Supabase
 * (`if (error) console.error`). Dữ liệu thật chỉ nằm ở localStorage → người
 * dùng tưởng đã lưu lên DB mà thực tế không (mất khi tải lại trang).
 *
 * Sửa đúng: `syncToSupabaseEmployees` trả `{ ok, error? }`; handleSaveEmployee
 * chỉ alert "thành công" khi `res.ok === true`, ngược lại báo rõ là KHÔNG đồng
 * bộ được. Quét NGUỒN để chặn tái phạm.
 */
const src = readFileSync(join(__dirname, 'components', 'HR.tsx'), 'utf-8').replace(/\r/g, '');

describe('HR.handleSaveEmployee — không được xướng "thành công" khi ghi DB hỏng', () => {
  it('syncToSupabaseEmployees trả về kết quả (Promise<{ok,error?}>), không nuốt lỗi', () => {
    expect(src).toContain(
      'const syncToSupabaseEmployees = async (emp: any): Promise<{ ok: boolean; error?: string }>'
    );
    // Đã bỏ đoạn nuốt lỗi: if (error) { console.error(...) }  (không return).
    expect(src).not.toContain(
      "if (error) {\n        console.error('[Supabase Claims Sync] Error syncing employee:', error);\n      } else {"
    );
  });

  it('handleSaveEmployee chỉ báo thành công khi res.ok', () => {
    // Cả hai nhánh (update / create) đều await rồi kiểm res.ok.
    const n = (src.match(/const res = await syncToSupabaseEmployees\(/g) || []).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(src).toContain('if (res.ok) {');
  });

  it('khi sync thất bại, nói rõ là KHÔNG đồng bộ được (không "thành công" vô điều kiện)', () => {
    // Thông báo thất bại phải có mặt.
    expect(src).toContain("alert('Không thể đồng bộ nhân viên lên cơ sở dữ liệu:");
    // Thông báo thành công CHỈ được phép nằm trong nhánh `if (res.ok) {`
    // (tức là sau khi await syncToSupabaseEmployees và kiểm res.ok), không được
    // đứng trần (vô điều kiện) như bản cũ.
    const okBlock = "    if (res.ok) {\n      alert('Đã cập nhật thông tin nhân viên thành công!');\n    } else {";
    const okBlockNew = "    if (res.ok) {\n      alert('Đã thêm mới nhân viên thành công!');\n    } else {";
    expect(src).toContain(okBlock);
    expect(src).toContain(okBlockNew);
    // Bản cũ: alert thành công đứng ngay sau `const res = await syncToSupabaseEmployees(...)`
    // MÀ KHÔNG có `if (res.ok) {` — pattern đó phải biến mất.
    expect(src).not.toContain(
      "const res = await syncToSupabaseEmployees(updated);\n    alert('Đã cập nhật thông tin nhân viên thành công!');"
    );
    expect(src).not.toContain(
      "const res = await syncToSupabaseEmployees(newEmp);\n    alert('Đã thêm mới nhân viên thành công!');"
    );
  });
});
