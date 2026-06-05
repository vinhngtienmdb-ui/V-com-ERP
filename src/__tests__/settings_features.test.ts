import { describe, it, expect } from 'vitest';

// 1. Chart of Accounts (COA) Validation Logic (corresponds to COA constraints in SettingsPage)
interface AccountItem {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parentCode?: string;
  isLeaf: boolean;
  isActive: boolean;
}

function validateNewCoa(
  newCoa: { code: string; name: string; type: string; parentCode?: string },
  coaList: AccountItem[]
): { isValid: boolean; error: string | null } {
  if (!newCoa.code || !newCoa.name) {
    return { isValid: false, error: 'Vui lòng điền đầy đủ Mã và Tên tài khoản.' };
  }
  if (newCoa.code.length < 4) {
    return { isValid: false, error: 'Mã tài khoản hạch toán chi tiết (tài khoản lá) phải có độ dài từ 4 chữ số trở lên.' };
  }
  if (coaList.some(c => c.code === newCoa.code)) {
    return { isValid: false, error: 'Mã tài khoản này đã tồn tại trong danh mục.' };
  }
  if (newCoa.parentCode) {
    const parent = coaList.find(c => c.code === newCoa.parentCode);
    if (!parent) {
      return { isValid: false, error: 'Tài khoản mẹ không tồn tại.' };
    }
  }
  return { isValid: true, error: null };
}

// 2. No-Code Workflows Logic
interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
}

interface ERPEvent {
  type: string;
  total_amount?: number;
  inventory_qty?: number;
  tax_code_missing?: boolean;
}

function processWorkflowEvent(event: ERPEvent, rule: WorkflowRule): { isTriggered: boolean; actionToPerform: string | null } {
  if (!rule.isActive) {
    return { isTriggered: false, actionToPerform: null };
  }

  // Check trigger matching
  if (rule.trigger === 'order_created' && event.type !== 'order_created') return { isTriggered: false, actionToPerform: null };
  if (rule.trigger === 'stock_low' && event.type !== 'stock_low') return { isTriggered: false, actionToPerform: null };
  if (rule.trigger === 'invoice_draft' && event.type !== 'invoice_draft') return { isTriggered: false, actionToPerform: null };

  // Check conditions
  let conditionPassed = false;
  if (rule.condition === 'total_amount > 20000000' && event.total_amount !== undefined) {
    conditionPassed = event.total_amount > 20000000;
  } else if (rule.condition === 'inventory_qty < 10' && event.inventory_qty !== undefined) {
    conditionPassed = event.inventory_qty < 10;
  } else if (rule.condition === 'tax_code_missing = true' && event.tax_code_missing !== undefined) {
    conditionPassed = event.tax_code_missing === true;
  }

  if (conditionPassed) {
    return { isTriggered: true, actionToPerform: rule.action };
  }

  return { isTriggered: false, actionToPerform: null };
}

describe('Settings module new features test suite', () => {
  const mockCoaList: AccountItem[] = [
    { code: '111', name: 'Tiền mặt', type: 'Asset', isLeaf: false, isActive: true },
    { code: '1111', name: 'Tiền Việt Nam (VNĐ)', type: 'Asset', parentCode: '111', isLeaf: true, isActive: true },
    { code: '112', name: 'Tiền gửi Ngân hàng', type: 'Asset', isLeaf: false, isActive: true },
    { code: '1331', name: 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', type: 'Asset', parentCode: '133', isLeaf: true, isActive: true },
  ];

  describe('Chart of Accounts (COA) validation', () => {
    it('should block empty account code or name', () => {
      const result = validateNewCoa({ code: '', name: 'Test', type: 'Asset' }, mockCoaList);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Vui lòng điền đầy đủ Mã và Tên tài khoản.');

      const result2 = validateNewCoa({ code: '1122', name: '', type: 'Asset' }, mockCoaList);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Vui lòng điền đầy đủ Mã và Tên tài khoản.');
    });

    it('should block account code shorter than 4 characters', () => {
      const result = validateNewCoa({ code: '113', name: 'Tiền mặt USD', type: 'Asset' }, mockCoaList);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Mã tài khoản hạch toán chi tiết (tài khoản lá) phải có độ dài từ 4 chữ số trở lên');
    });

    it('should block duplicate account codes', () => {
      const result = validateNewCoa({ code: '1111', name: 'Tiền Việt Nam đồng', type: 'Asset' }, mockCoaList);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Mã tài khoản này đã tồn tại trong danh mục.');
    });

    it('should allow valid leaf account codes >= 4 characters', () => {
      const result = validateNewCoa({ code: '1113', name: 'Tiền gửi Techcombank', type: 'Asset', parentCode: '111' }, mockCoaList);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should fail if parent account does not exist', () => {
      const result = validateNewCoa({ code: '1114', name: 'Tiền gửi Agribank', type: 'Asset', parentCode: '999' }, mockCoaList);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Tài khoản mẹ không tồn tại.');
    });
  });

  describe('No-Code Workflow evaluation', () => {
    const rules: WorkflowRule[] = [
      { id: 'wf-1', name: 'Gửi Zalo ZNS khi có Đơn hàng VIP mới', trigger: 'order_created', condition: 'total_amount > 20000000', action: 'send_zalo_zns', isActive: true },
      { id: 'wf-2', name: 'Thông báo Push cho Admin khi hàng tồn kho sắp hết', trigger: 'stock_low', condition: 'inventory_qty < 10', action: 'send_push_admin', isActive: true },
      { id: 'wf-3', name: 'Chặn hạch toán tự động khi thiếu mã số thuế đối tượng lẻ', trigger: 'invoice_draft', condition: 'tax_code_missing = true', action: 'block_bookkeeping', isActive: false },
    ];

    it('should trigger Zalo ZNS if order total is above 20,000,000đ', () => {
      const event: ERPEvent = { type: 'order_created', total_amount: 25000000 };
      const result = processWorkflowEvent(event, rules[0]);
      expect(result.isTriggered).toBe(true);
      expect(result.actionToPerform).toBe('send_zalo_zns');
    });

    it('should not trigger Zalo ZNS if order total is under 20,000,000đ', () => {
      const event: ERPEvent = { type: 'order_created', total_amount: 15000000 };
      const result = processWorkflowEvent(event, rules[0]);
      expect(result.isTriggered).toBe(false);
      expect(result.actionToPerform).toBeNull();
    });

    it('should trigger push notification if stock level is under 10', () => {
      const event: ERPEvent = { type: 'stock_low', inventory_qty: 5 };
      const result = processWorkflowEvent(event, rules[1]);
      expect(result.isTriggered).toBe(true);
      expect(result.actionToPerform).toBe('send_push_admin');
    });

    it('should not trigger push notification if stock level is 12', () => {
      const event: ERPEvent = { type: 'stock_low', inventory_qty: 12 };
      const result = processWorkflowEvent(event, rules[1]);
      expect(result.isTriggered).toBe(false);
      expect(result.actionToPerform).toBeNull();
    });

    it('should not trigger rule if the rule is inactive', () => {
      const event: ERPEvent = { type: 'invoice_draft', tax_code_missing: true };
      const result = processWorkflowEvent(event, rules[2]);
      expect(result.isTriggered).toBe(false);
      expect(result.actionToPerform).toBeNull();
    });
  });
});
