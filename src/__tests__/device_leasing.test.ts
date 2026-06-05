import { describe, it, expect } from 'vitest';
import { 
  calculateLeaseStats, 
  getCicGroupFromCccd, 
  determineKnoxStatusFromInstallments 
} from '../components/DeviceLeasing';

// Mock types to mimic contract checking behavior
interface InstallmentSchedule {
  installmentId: string;
  periodNum: number;
  dueDate: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
}

interface LeaseContractSim {
  id: string;
  customerName: string;
  status: 'active' | 'late' | 'completed';
  knoxStatus: 'unlocked' | 'warning' | 'locked';
  autoLockOverdue: boolean;
  installments: InstallmentSchedule[];
}

// Mimic the component's automated Knox lock rule checker
function runKnoxAutoLockChecker(contract: LeaseContractSim, currentDateStr: string): { knoxStatus: 'unlocked' | 'warning' | 'locked'; lockedByAutoLock: boolean } {
  if (!contract.autoLockOverdue || contract.knoxStatus === 'locked' || !['active', 'late'].includes(contract.status)) {
    return { knoxStatus: contract.knoxStatus, lockedByAutoLock: false };
  }

  const now = new Date(currentDateStr);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const hasThirtyDaysOverdue = contract.installments.some(inst => {
    if (inst.status === 'overdue' || inst.status === 'unpaid') {
      const dueTime = new Date(inst.dueDate).getTime();
      return (now.getTime() - dueTime) >= thirtyDaysMs;
    }
    return false;
  });

  if (hasThirtyDaysOverdue) {
    return { knoxStatus: 'locked', lockedByAutoLock: true };
  }

  return { knoxStatus: contract.knoxStatus, lockedByAutoLock: false };
}

describe('Device Leasing & Knox MDM Test Suite', () => {

  describe('Lease Dynamic Pricing & Stats Calculator', () => {
    it('should correctly calculate deposit fee, monthly installments, and total paid', () => {
      const price = 30000000; // 30M VND
      const upfrontPercent = 20; // 20% deposit
      const duration = 12; // 12 months

      const stats = calculateLeaseStats(price, upfrontPercent, duration);

      // Deposit = 30M * 0.2 = 6M
      expect(stats.upfront).toBe(6000000);

      // Principal to amortize = 30M - 6M = 24M
      // Interest total = 24M * (1.2% * 12) = 24M * 0.144 = 3,456,000 VND
      // Monthly installment = Math.round((24M + 3,456,000) / 12) = Math.round(27,456,000 / 12) = 2,288,000 VND
      expect(stats.monthly).toBe(2288000);

      // Total Paid = 6M + 2,288,000 * 12 = 33,456,000 VND
      expect(stats.totalPaid).toBe(6000000 + (2288000 * 12));
    });
  });

  describe('CIC Credit Bureau Mapping Logic', () => {
    it('should map standard national ID digits to appropriate CIC risk groups', () => {
      // Last digit 0, 9, 7, 5 -> Group 1 (Good credit score)
      const resG1 = getCicGroupFromCccd('030099026350');
      expect(resG1.group).toBe(1);
      expect(resG1.score).toBeGreaterThanOrEqual(750);
      expect(resG1.notes).toContain('Nợ đủ tiêu chuẩn');

      // Last digit 1 or 3 -> Group 2 (Need attention / slow payment < 30 days)
      const resG2 = getCicGroupFromCccd('030099026351');
      expect(resG2.group).toBe(2);
      expect(resG2.score).toBeLessThanOrEqual(620);
      expect(resG2.notes).toContain('Nợ cần chú ý');

      // Last digit 2 -> Group 3 (Under standard / 30-90 days overdue)
      const resG3 = getCicGroupFromCccd('030099026352');
      expect(resG3.group).toBe(3);
      expect(resG3.score).toBe(480);
      expect(resG3.notes).toContain('Nợ dưới tiêu chuẩn');

      // Last digit 4 -> Group 4 (Suspicious / 90-180 days overdue)
      const resG4 = getCicGroupFromCccd('030099026354');
      expect(resG4.group).toBe(4);
      expect(resG4.score).toBe(380);

      // Last digit 6, 8 -> Group 5 (Bad debt / > 180 days overdue)
      const resG5 = getCicGroupFromCccd('030099026356');
      expect(resG5.group).toBe(5);
      expect(resG5.score).toBe(320);
      expect(resG5.notes).toContain('Nợ có khả năng mất vốn');
    });
  });

  describe('Standard Knox Status Determinator', () => {
    it('should assignUnlocked state if there are no overdue installments', () => {
      const installments: InstallmentSchedule[] = [
        { installmentId: '1', periodNum: 1, dueDate: '2026-04-15', amount: 2000000, status: 'paid' },
        { installmentId: '2', periodNum: 2, dueDate: '2026-05-15', amount: 2000000, status: 'unpaid' }
      ];
      expect(determineKnoxStatusFromInstallments(installments)).toBe('unlocked');
    });

    it('should assign Warning state if exactly 1 installment is overdue', () => {
      const installments: InstallmentSchedule[] = [
        { installmentId: '1', periodNum: 1, dueDate: '2026-04-15', amount: 2000000, status: 'overdue' },
        { installmentId: '2', periodNum: 2, dueDate: '2026-05-15', amount: 2000000, status: 'unpaid' }
      ];
      expect(determineKnoxStatusFromInstallments(installments)).toBe('warning');
    });

    it('should assign Locked state if 2 or more installments are overdue', () => {
      const installments: InstallmentSchedule[] = [
        { installmentId: '1', periodNum: 1, dueDate: '2026-04-15', amount: 2000000, status: 'overdue' },
        { installmentId: '2', periodNum: 2, dueDate: '2026-05-15', amount: 2000000, status: 'overdue' }
      ];
      expect(determineKnoxStatusFromInstallments(installments)).toBe('locked');
    });
  });

  describe('Knox MDM Auto-Locking 30+ Days Overdue Rule', () => {
    it('should trigger Knox lock if rule is enabled and payment is overdue by 30+ days', () => {
      const mockContract: LeaseContractSim = {
        id: 'L-001',
        customerName: 'Hoàng Văn Nam',
        status: 'late',
        knoxStatus: 'warning',
        autoLockOverdue: true,
        installments: [
          { installmentId: 'inst-1', periodNum: 1, dueDate: '2026-05-01', amount: 2000000, status: 'overdue' },
          { installmentId: 'inst-2', periodNum: 2, dueDate: '2026-06-01', amount: 2000000, status: 'unpaid' }
        ]
      };

      // Check date: 2026-06-05. Overdue installment due date: 2026-05-01.
      // Time difference: 35 days (over 30 days) -> Should auto lock.
      const result = runKnoxAutoLockChecker(mockContract, '2026-06-05');
      expect(result.knoxStatus).toBe('locked');
      expect(result.lockedByAutoLock).toBe(true);
    });

    it('should not lock if rule is enabled but payment is overdue by less than 30 days', () => {
      const mockContract: LeaseContractSim = {
        id: 'L-002',
        customerName: 'Phạm Minh Đức',
        status: 'late',
        knoxStatus: 'warning',
        autoLockOverdue: true,
        installments: [
          { installmentId: 'inst-1', periodNum: 1, dueDate: '2026-05-20', amount: 2000000, status: 'overdue' }
        ]
      };

      // Check date: 2026-06-05. Overdue date: 2026-05-20.
      // Time difference: 16 days -> Less than 30 days. Should remain warn.
      const result = runKnoxAutoLockChecker(mockContract, '2026-06-05');
      expect(result.knoxStatus).toBe('warning');
      expect(result.lockedByAutoLock).toBe(false);
    });

    it('should do nothing if auto-lock rule is disabled even if overdue by > 30 days', () => {
      const mockContract: LeaseContractSim = {
        id: 'L-003',
        customerName: 'Trần Bảo Long',
        status: 'late',
        knoxStatus: 'warning',
        autoLockOverdue: false, // Rule disabled
        installments: [
          { installmentId: 'inst-1', periodNum: 1, dueDate: '2026-04-10', amount: 2000000, status: 'overdue' }
        ]
      };

      // Overdue for 56 days, but rule disabled. Should remain warning.
      const result = runKnoxAutoLockChecker(mockContract, '2026-06-05');
      expect(result.knoxStatus).toBe('warning');
      expect(result.lockedByAutoLock).toBe(false);
    });
  });
});
