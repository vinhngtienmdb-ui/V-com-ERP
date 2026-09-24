/**
 * Bộ tiện ích xử lý định dạng ngày tháng chuẩn Kế toán Việt Nam:
 * - Định dạng ngày tháng: dd/mm/yyyy
 * - Định dạng tháng: mm/yyyy
 * Tuân thủ Thông tư 99/2025/TT-BTC & Luật Kế toán 88/2015/QH13
 */

/**
 * Định dạng ngày tháng chuẩn Kế toán Việt Nam: dd/mm/yyyy
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

/**
 * Định dạng ngày giờ: dd/mm/yyyy HH:mm
 */
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

/**
 * Định dạng tháng chuẩn Kế toán Việt Nam: mm/yyyy
 * Nhận vào chuỗi như '2026-03', '2026/03', '03/2026', 'T03/2026', '2026-03-15', Date object, v.v.
 * Trả về định dạng mm/yyyy (VD: '03/2026')
 */
export function formatMonthVN(monthInput: string | Date | undefined | null): string {
  if (!monthInput) return '';

  if (typeof monthInput === 'string') {
    const trimmed = monthInput.trim();

    // Đã đúng định dạng mm/yyyy (VD: 03/2026)
    if (/^\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Dạng m/yyyy (VD: 3/2026 -> 03/2026)
    const singleMonthSlash = trimmed.match(/^(\d{1})\/(\d{4})$/);
    if (singleMonthSlash) {
      return `0${singleMonthSlash[1]}/${singleMonthSlash[2]}`;
    }

    // Dạng T03/2026 hoặc T3/2026
    const tPrefix = trimmed.match(/^T(\d{1,2})\/(\d{4})$/i);
    if (tPrefix) {
      return `${String(tPrefix[1]).padStart(2, '0')}/${tPrefix[2]}`;
    }

    // Dạng yyyy-mm hoặc yyyy-m (VD: 2026-03 hoặc 2026-3)
    const ymMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
    if (ymMatch) {
      return `${String(ymMatch[2]).padStart(2, '0')}/${ymMatch[1]}`;
    }

    // Dạng yyyy/mm hoặc yyyy/m
    const ySlashMMatch = trimmed.match(/^(\d{4})\/(\d{1,2})$/);
    if (ySlashMMatch) {
      return `${String(ySlashMMatch[2]).padStart(2, '0')}/${ySlashMMatch[1]}`;
    }

    // Dạng ngày đầy đủ ISO: yyyy-mm-dd
    const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-\d{2}/);
    if (isoDateMatch) {
      return `${isoDateMatch[2]}/${isoDateMatch[1]}`;
    }

    // Dạng ngày đầy đủ VN: dd/mm/yyyy
    const vnDateMatch = trimmed.match(/^\d{2}\/(\d{2})\/(\d{4})/);
    if (vnDateMatch) {
      return `${vnDateMatch[1]}/${vnDateMatch[2]}`;
    }

    // Dạng 'Tháng 3/2026' hoặc 'Tháng 03/2026'
    const textMonth = trimmed.match(/th[áa]ng\s*(\d{1,2})[\/\-\s]+(\d{4})/i);
    if (textMonth) {
      return `${String(textMonth[1]).padStart(2, '0')}/${textMonth[2]}`;
    }
  }

  const d = new Date(monthInput);
  if (isNaN(d.getTime())) {
    return String(monthInput);
  }

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${year}`;
}

/**
 * Định dạng cặp tháng và năm thành mm/yyyy
 */
export function formatMonthYearVN(month: number | string, year: number | string): string {
  const m = String(month).padStart(2, '0');
  return `${m}/${year}`;
}
