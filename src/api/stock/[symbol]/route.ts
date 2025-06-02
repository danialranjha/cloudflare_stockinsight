import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { calculateIslamicRatios } from '@/lib/islamicCompliance';

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'Missing stock symbol' }, { status: 400 });
  }

  try {
    // Fetch company info
    const info = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'price', 'summaryDetail'] });
    // Fetch financials
    const financials = await yahooFinance.quoteSummary(symbol, { modules: ['balanceSheetHistory', 'incomeStatementHistory', 'cashflowStatementHistory'] });
    // Fetch historical prices (1y daily)
    const history = await yahooFinance.historical(symbol, { period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), period2: new Date(), interval: '1d' });

    // Map to expected types for compliance logic
    const infoData = {
      symbol,
      name: info.price?.longName || info.price?.shortName || symbol,
      sector: info.assetProfile?.sector || '',
      industry: info.assetProfile?.industry || '',
      summary: info.assetProfile?.longBusinessSummary || '',
      marketCap: info.price?.marketCap || 0,
      // Add more fields as needed
    };

    // Use latest balance sheet for financial data
    type BalanceSheet = {
      longTermDebt?: { raw?: number };
      totalAssets?: { raw?: number };
      goodWill?: { raw?: number };
    };
    const latestBalanceSheet = financials.balanceSheetHistory?.balanceSheetStatements?.[0] as BalanceSheet | undefined;
    const financialData = {
      Long_Term_Debt: latestBalanceSheet?.longTermDebt?.raw ?? 0,
      Total_Assets: latestBalanceSheet?.totalAssets?.raw ?? 0,
      Goodwill_And_Intangibles: latestBalanceSheet?.goodWill?.raw ?? 0,
      // Add more fields as needed
    };

    // Run compliance logic
    const compliance = calculateIslamicRatios(financialData, infoData);

    return NextResponse.json({
      symbol,
      info: infoData,
      financials: financialData,
      history,
      compliance,
    });
  } catch (err: unknown) {
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message?: string }).message
        : 'Failed to fetch data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}