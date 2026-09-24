/**
 * Bộ tiện ích xử lý định dạng ngày tháng chuẩn Kế toán Việt Nam (dd/mm/yyyy)
 * Tuân thủ Thông tư 99/2025/TT-BTC & Luật Kế toán 88/2015/QH13
 */

export function formatDateVN(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Đã đúng định dạng dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Định dạng ISO yyyy-mm-dd hoặc yyyy-mm-ddTHH:mm:ss
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    // Định dạng yyyy/mm/dd
    const slashMatch = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (slashMatch) {
      return `${slashMatch[3]}/${slashMatch[2]}/${slashMatch[1]}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTimeVN(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return formatDateVN(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
