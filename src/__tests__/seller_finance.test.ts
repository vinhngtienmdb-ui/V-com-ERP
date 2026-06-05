import { describe, it, expect } from 'vitest';

// 1. Types & Mock data mimicking component structures
interface SimulatedSeller {
  sellerId: string;
  sellerName: string;
  gmvGrowth: number;       // 0-100 scale
  refundRate: number;       // 0-100 scale (high is good/low refund)
  buyerRating: number;      // 0-100 scale
  complianceIndex: number;  // 0-100 scale
  maxLimitBase: number;
  outstandingDebt: number;
  score: number;
  tier: 'AAA' | 'AA' | 'A' | 'B' | 'C';
  maxCreditLimit: number;
  availableCredit: number;
}

interface EarlyPayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  discountFee: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'disbursed';
}

// Mimic the scoring calculation logic
function calculateMockScore(
  seller: { gmvGrowth: number; refundRate: number; buyerRating: number; complianceIndex: number },
  weights: { gmvGrowth: number; refundRate: number; buyerRating: number; complianceIndex: number }
): number {
  const factor = (
    seller.gmvGrowth * (weights.gmvGrowth / 100) +
    seller.refundRate * (weights.refundRate / 100) +
    seller.buyerRating * (weights.buyerRating / 100) +
    seller.complianceIndex * (weights.complianceIndex / 100)
  );
  return Math.min(1000, Math.max(100, Math.round(factor * 10)));
}

function getMockTierAndLimit(score: number, baseLimit: number): { tier: 'AAA' | 'AA' | 'A' | 'B' | 'C'; maxCreditLimit: number } {
  let tier: 'AAA' | 'AA' | 'A' | 'B' | 'C' = 'C';
  let multiplier = 0.2;
  if (score >= 850) {
    tier = 'AAA';
    multiplier = 1.0;
  } else if (score >= 750) {
    tier = 'AA';
    multiplier = 0.8;
  } else if (score >= 650) {
    tier = 'A';
    multiplier = 0.5;
  } else if (score >= 500) {
    tier = 'B';
    multiplier = 0.3;
  }
  const maxCreditLimit = Math.round(baseLimit * multiplier);
  return { tier, maxCreditLimit };
}

// Early Payout calculation helper
function calculateEarlyPayout(amount: number, feePercent: number = 1.0) {
  const discountFee = Math.round(amount * (feePercent / 100));
  const netAmount = amount - discountFee;
  
  // Return entries suitable for MISA bookkeeping sync
  return {
    amount,
    discountFee,
    netAmount,
    misaVoucher: {
      debitAccount: '131', // Phải thu khách hàng - Seller subaccount
      creditAccount: '112', // Tiền gửi ngân hàng - Escrow bank account
      creditFeeAccount: '5111', // Doanh thu cung cấp dịch vụ (Phí ứng vốn)
      debitAmount: amount,
      creditAmount: netAmount,
      feeAmount: discountFee
    }
  };
}

describe('Supply Chain Finance (Hỗ trợ tài chính nhà bán) Test Suite', () => {
  
  const mockSeller: SimulatedSeller = {
    sellerId: 'SEL-001',
    sellerName: 'Thời Trang H&M Vietnam',
    gmvGrowth: 85,
    refundRate: 95,
    buyerRating: 90,
    complianceIndex: 80,
    maxLimitBase: 500000000,
    outstandingDebt: 100000000,
    score: 0,
    tier: 'C',
    maxCreditLimit: 0,
    availableCredit: 0
  };

  describe('Credit Score Simulation Engine', () => {
    it('should correctly calculate score based on weights totaling 100%', () => {
      const weights = { gmvGrowth: 30, refundRate: 20, buyerRating: 25, complianceIndex: 25 };
      const score = calculateMockScore(mockSeller, weights);
      
      // (85*0.3 + 95*0.2 + 90*0.25 + 80*0.25) * 10 = (25.5 + 19 + 22.5 + 20) * 10 = 87 * 10 = 870
      expect(score).toBe(870);
    });

    it('should assign correct Tier and max Credit Limit according to score scale', () => {
      // Score: 870 >= 850 -> Tier: AAA, Limit = 100% of base (500M)
      const { tier, maxCreditLimit } = getMockTierAndLimit(870, mockSeller.maxLimitBase);
      expect(tier).toBe('AAA');
      expect(maxCreditLimit).toBe(500000000);

      // Score: 720 -> Tier: A, Limit = 50% of base (250M)
      const { tier: tierA, maxCreditLimit: limitA } = getMockTierAndLimit(720, mockSeller.maxLimitBase);
      expect(tierA).toBe('A');
      expect(limitA).toBe(250000000);
      
      // Score: 480 -> Tier: C, Limit = 20% of base (100M)
      const { tier: tierC, maxCreditLimit: limitC } = getMockTierAndLimit(480, mockSeller.maxLimitBase);
      expect(tierC).toBe('C');
      expect(limitC).toBe(100000000);
    });

    it('should enforce score caps between 100 and 1000', () => {
      const bestSeller = { gmvGrowth: 100, refundRate: 100, buyerRating: 100, complianceIndex: 100 };
      const worstSeller = { gmvGrowth: 0, refundRate: 0, buyerRating: 0, complianceIndex: 0 };
      const weights = { gmvGrowth: 40, refundRate: 20, buyerRating: 20, complianceIndex: 20 };

      expect(calculateMockScore(bestSeller, weights)).toBe(1000);
      expect(calculateMockScore(worstSeller, weights)).toBe(100); // capped at 100 minimum
    });
  });

  describe('Early Payout Deductions & MISA Journal Entry Logic', () => {
    it('should correctly deduct 1% fee and structure Napas Net amount', () => {
      const payoutResult = calculateEarlyPayout(50000000, 1.0); // 50M request
      
      expect(payoutResult.discountFee).toBe(500000); // 500K fee
      expect(payoutResult.netAmount).toBe(49500000); // 49.5M net cash
    });

    it('should generate double-entry voucher compliant with Circular 200/2014/TT-BTC', () => {
      const payoutResult = calculateEarlyPayout(80000000, 1.2); // 80M request at 1.2% fee
      
      const { misaVoucher } = payoutResult;
      expect(misaVoucher.debitAccount).toBe('131');
      expect(misaVoucher.creditAccount).toBe('112');
      expect(misaVoucher.creditFeeAccount).toBe('5111');
      
      expect(misaVoucher.debitAmount).toBe(80000000);
      expect(misaVoucher.feeAmount).toBe(960000); // 80M * 1.2% = 960K
      expect(misaVoucher.creditAmount).toBe(79040000); // 80M - 960K = 79.04M
    });
  });

  describe('Credit Limit Risk Checks', () => {
    it('should trigger warnings if manual credit limit input exceeds rating safe threshold', () => {
      const score = 680; // Tier A (Safe multiplier: 50%)
      const baseLimit = 400000000;
      const { maxCreditLimit } = getMockTierAndLimit(score, baseLimit); // 200,000,000
      
      const proposedLimitHigh = 250000000;
      const proposedLimitSafe = 180000000;

      const isOverLimitHigh = proposedLimitHigh > maxCreditLimit;
      const isOverLimitSafe = proposedLimitSafe > maxCreditLimit;

      expect(isOverLimitHigh).toBe(true);
      expect(isOverLimitSafe).toBe(false);
    });
  });
});
