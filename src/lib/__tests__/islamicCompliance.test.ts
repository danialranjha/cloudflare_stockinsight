import {
  calculateDebtRatio,
  calculateLiquidityRatio,
  calculateReceivablesRatio,
  calculateIslamicRatios,
} from '../islamicCompliance';

describe('Islamic Compliance Ratio Calculations', () => {
  describe('calculateDebtRatio', () => {
    it('calculates correct debt ratio', () => {
      expect(
        calculateDebtRatio({
          Long_Term_Debt: 100,
          Total_Assets: 1000,
          Goodwill_And_Intangibles: 100,
        })
      ).toBeCloseTo(11.11, 2);
    });

    it('returns null if any field is missing', () => {
      expect(
        calculateDebtRatio({
          Long_Term_Debt: 100,
          Total_Assets: 1000,
        })
      ).toBeNull();
      expect(
        calculateDebtRatio({
          Total_Assets: 1000,
          Goodwill_And_Intangibles: 100,
        })
      ).toBeNull();
      expect(
        calculateDebtRatio({
          Long_Term_Debt: 100,
          Goodwill_And_Intangibles: 100,
        })
      ).toBeNull();
    });

    it('returns null if adjusted assets is zero or negative', () => {
      expect(
        calculateDebtRatio({
          Long_Term_Debt: 100,
          Total_Assets: 100,
          Goodwill_And_Intangibles: 100,
        })
      ).toBeNull();
      expect(
        calculateDebtRatio({
          Long_Term_Debt: 100,
          Total_Assets: 50,
          Goodwill_And_Intangibles: 100,
        })
      ).toBeNull();
    });
  });

  describe('calculateLiquidityRatio', () => {
    it('calculates correct liquidity ratio', () => {
      expect(
        calculateLiquidityRatio({
          totalCash: 100,
          shortTermInvestments: 50,
          longTermInvestments: 50,
          marketCap: 400,
        })
      ).toBeCloseTo(50, 2);
    });

    it('returns 0 if marketCap is zero or missing', () => {
      expect(
        calculateLiquidityRatio({
          totalCash: 100,
          shortTermInvestments: 50,
          longTermInvestments: 50,
          marketCap: 0,
        })
      ).toBe(0);
      expect(
        calculateLiquidityRatio({
          totalCash: 100,
          shortTermInvestments: 50,
          longTermInvestments: 50,
        })
      ).toBe(0);
    });

    it('treats missing fields as zero', () => {
      expect(
        calculateLiquidityRatio({
          marketCap: 100,
        })
      ).toBe(0);
    });
  });

  describe('calculateReceivablesRatio', () => {
    it('calculates correct receivables ratio', () => {
      expect(
        calculateReceivablesRatio({
          netReceivables: 25,
          marketCap: 100,
        })
      ).toBeCloseTo(25, 2);
    });

    it('returns 0 if marketCap is zero or missing', () => {
      expect(
        calculateReceivablesRatio({
          netReceivables: 25,
          marketCap: 0,
        })
      ).toBe(0);
      expect(
        calculateReceivablesRatio({
          netReceivables: 25,
        })
      ).toBe(0);
    });

    it('treats missing netReceivables as zero', () => {
      expect(
        calculateReceivablesRatio({
          marketCap: 100,
        })
      ).toBe(0);
    });
  });

  describe('calculateIslamicRatios', () => {
    it('returns null if debt ratio cannot be calculated', () => {
      expect(
        calculateIslamicRatios(
          { Long_Term_Debt: 100, Total_Assets: 1000 },
          { marketCap: 1000 }
        )
      ).toBeNull();
    });

    it('returns correct compliance result for compliant company', () => {
      const result = calculateIslamicRatios(
        {
          Long_Term_Debt: 100,
          Total_Assets: 1000,
          Goodwill_And_Intangibles: 100,
        },
        {
          marketCap: 1000,
          totalCash: 100,
          shortTermInvestments: 100,
          longTermInvestments: 100,
          netReceivables: 100,
          sector: 'Technology',
          industry: 'Software',
          longName: 'Halal Tech',
          longBusinessSummary: 'A software company.',
        }
      );
      expect(result).not.toBeNull();
      expect(result?.is_fully_compliant).toBe(true);
      expect(result?.non_compliant_reasons).toEqual([]);
    });

    it('flags non-compliance for high debt ratio', () => {
      const result = calculateIslamicRatios(
        {
          Long_Term_Debt: 400,
          Total_Assets: 1000,
          Goodwill_And_Intangibles: 100,
        },
        {
          marketCap: 1000,
          totalCash: 100,
          shortTermInvestments: 100,
          longTermInvestments: 100,
          netReceivables: 100,
          sector: 'Technology',
          industry: 'Software',
          longName: 'Halal Tech',
          longBusinessSummary: 'A software company.',
        }
      );
      expect(result).not.toBeNull();
      expect(result?.is_debt_compliant).toBe(false);
      expect(result?.is_fully_compliant).toBe(false);
      expect(result?.non_compliant_reasons).toContain('Debt ratio >= 33%');
    });

    it('flags non-compliance for business exclusion', () => {
      const result = calculateIslamicRatios(
        {
          Long_Term_Debt: 100,
          Total_Assets: 1000,
          Goodwill_And_Intangibles: 100,
        },
        {
          marketCap: 1000,
          totalCash: 100,
          shortTermInvestments: 100,
          longTermInvestments: 100,
          netReceivables: 100,
          sector: 'Banks',
          industry: 'Banking',
          longName: 'Bank of Pork',
          longBusinessSummary: 'A bank that deals with pork products.',
        }
      );
      expect(result).not.toBeNull();
      expect(result?.is_business_compliant).toBe(false);
      expect(result?.is_fully_compliant).toBe(false);
      expect(result?.non_compliant_reasons.length).toBeGreaterThan(0);
    });
  });
});