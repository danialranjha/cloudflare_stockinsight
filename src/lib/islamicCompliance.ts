/**
 * Islamic Compliance Screening Logic (ported from Python)
 * - Debt Ratio, Liquidity Ratio, Receivables Ratio
 * - Business Activity Exclusions
 * - Aggregation and Compliance Decision
 */

type FinancialData = {
  Long_Term_Debt?: number;
  Total_Assets?: number;
  Goodwill_And_Intangibles?: number;
};

type InfoData = {
  marketCap?: number;
  totalCash?: number;
  shortTermInvestments?: number;
  longTermInvestments?: number;
  netReceivables?: number;
  sector?: string;
  industry?: string;
  longName?: string;
  longBusinessSummary?: string;
};

type ComplianceResult = {
  debt_ratio: number | null;
  liquidity_ratio: number;
  receivables_ratio: number;
  is_debt_compliant: boolean;
  is_liquidity_compliant: boolean;
  is_receivables_compliant: boolean;
  is_business_compliant: boolean;
  non_compliant_reasons: string[];
  is_fully_compliant: boolean;
};

const BUSINESS_EXCLUSION_KEYWORDS = [
  "alcohol", "gambling", "casino", "betting", "tobacco", "cigarette", "pork",
  "swine", "weapons", "firearm", "defense", "adult", "porn", "sex", "bank",
  "insurance", "asset management", "interest", "mortgage", "loan", "credit"
];

const BUSINESS_EXCLUSION_SECTORS = [
  "Banks", "Insurance", "Diversified Financials", "Consumer Finance", "Tobacco",
  "Casinos & Gaming", "Aerospace & Defense", "Beverages", "Food Products"
];

const BUSINESS_EXCLUSION_INDUSTRIES = [
  "Tobacco", "Casinos & Gaming", "Aerospace & Defense", "Brewers", "Distillers & Vintners",
  "Packaged Foods & Meats", "Pornography", "Adult Entertainment", "Banks", "Insurance"
];

function containsExclusionKeyword(text?: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BUSINESS_EXCLUSION_KEYWORDS.some(keyword => lower.includes(keyword));
}

function isBusinessCompliant(info: InfoData): { compliant: boolean, reasons: string[] } {
  const reasons: string[] = [];
  if (containsExclusionKeyword(info.longName)) reasons.push("Company name contains exclusion keyword");
  if (containsExclusionKeyword(info.sector)) reasons.push("Sector contains exclusion keyword");
  if (containsExclusionKeyword(info.industry)) reasons.push("Industry contains exclusion keyword");
  if (containsExclusionKeyword(info.longBusinessSummary)) reasons.push("Business summary contains exclusion keyword");

  if (info.sector && BUSINESS_EXCLUSION_SECTORS.includes(info.sector)) {
    reasons.push(`Sector "${info.sector}" is excluded`);
  }
  if (info.industry && BUSINESS_EXCLUSION_INDUSTRIES.includes(info.industry)) {
    reasons.push(`Industry "${info.industry}" is excluded`);
  }
  return { compliant: reasons.length === 0, reasons };
}

export function calculateDebtRatio(financial_data: FinancialData): number | null {
  const { Long_Term_Debt, Total_Assets, Goodwill_And_Intangibles } = financial_data;
  if (
    Long_Term_Debt === undefined ||
    Total_Assets === undefined ||
    Goodwill_And_Intangibles === undefined
  ) {
    return null;
  }
  const adjustedAssets = Total_Assets - Goodwill_And_Intangibles;
  if (adjustedAssets <= 0) return null;
  const ratio = (Long_Term_Debt / adjustedAssets) * 100;
  return Math.round(ratio * 100) / 100;
}

export function calculateLiquidityRatio(info: InfoData): number {
  const totalCash = info.totalCash ?? 0;
  const shortTermInvestments = info.shortTermInvestments ?? 0;
  const longTermInvestments = info.longTermInvestments ?? 0;
  const marketCap = info.marketCap ?? 0;
  if (!marketCap || marketCap <= 0) return 0;
  const cashAndInvestments = totalCash + shortTermInvestments + longTermInvestments;
  const ratio = (cashAndInvestments / marketCap) * 100;
  return Math.round(ratio * 100) / 100;
}

export function calculateReceivablesRatio(info: InfoData): number {
  const netReceivables = info.netReceivables ?? 0;
  const marketCap = info.marketCap ?? 0;
  if (!marketCap || marketCap <= 0) return 0;
  const ratio = (netReceivables / marketCap) * 100;
  return Math.round(ratio * 100) / 100;
}

export function calculateIslamicRatios(
  financial_data: FinancialData,
  info: InfoData
): ComplianceResult | null {
  try {
    // Debt Ratio
    const debt_ratio = calculateDebtRatio(financial_data);
    const is_debt_compliant = debt_ratio !== null && debt_ratio < 33;

    // Liquidity Ratio
    let liquidity_ratio = 0;
    let is_liquidity_compliant = true;
    if (info.marketCap && info.marketCap > 0) {
      liquidity_ratio = calculateLiquidityRatio(info);
      is_liquidity_compliant = liquidity_ratio < 33;
    }

    // Receivables Ratio
    let receivables_ratio = 0;
    let is_receivables_compliant = true;
    if (info.marketCap && info.marketCap > 0) {
      receivables_ratio = calculateReceivablesRatio(info);
      is_receivables_compliant = receivables_ratio < 33;
    }

    // Business Activity Exclusions
    const { compliant: is_business_compliant, reasons: business_reasons } = isBusinessCompliant(info);

    // Aggregate
    const is_fully_compliant =
      is_debt_compliant &&
      is_liquidity_compliant &&
      is_receivables_compliant &&
      is_business_compliant;

    const non_compliant_reasons: string[] = [];
    if (!is_debt_compliant) non_compliant_reasons.push("Debt ratio >= 33% or data missing");
    if (!is_liquidity_compliant) non_compliant_reasons.push("Liquidity ratio >= 33%");
    if (!is_receivables_compliant) non_compliant_reasons.push("Receivables ratio >= 33%");
    if (!is_business_compliant) non_compliant_reasons.push(...business_reasons);

    return {
      debt_ratio,
      liquidity_ratio,
      receivables_ratio,
      is_debt_compliant,
      is_liquidity_compliant,
      is_receivables_compliant,
      is_business_compliant,
      non_compliant_reasons,
      is_fully_compliant,
    };
  } catch (err) {
    // On any calculation error, return null
    return null;
  }
}