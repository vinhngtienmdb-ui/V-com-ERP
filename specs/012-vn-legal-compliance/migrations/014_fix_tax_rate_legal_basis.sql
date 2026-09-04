-- Correction (2026-09-02): NĐ 72/2025 is the WRONG document for the 2% VAT cut.
-- NĐ 72/2025/NĐ-CP (28/3/2025) governs electricity retail pricing. The correct basis
-- for the 10%→8% GTGT reduction (until 31/12/2026) is NĐ 174/2025/NĐ-CP (per NQ 204/2025/QH15).
-- Rate (0.08) and effective dates are unchanged — only the citation label is corrected.
-- Idempotent: safe to re-run; only updates rows that still carry the wrong label.

update public.tax_rate_rules
set legal_basis = 'NĐ 174/2025/NĐ-CP',
    note = 'Giảm 2% thuế GTGT cho hầu hết hàng hóa'
where legal_basis like '%NĐ 72/2025%';
