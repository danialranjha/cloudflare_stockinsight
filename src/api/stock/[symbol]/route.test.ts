import { GET } from './route';
import { NextRequest } from 'next/server';

jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    quoteSummary: jest.fn((symbol: string, opts: any) => {
      if (opts.modules.includes('assetProfile')) {
        return Promise.resolve({
          assetProfile: { sector: 'Technology', industry: 'Software', longBusinessSummary: 'A tech company.' },
          price: { longName: 'Test Corp', marketCap: 1000 },
        });
      }
      if (opts.modules.includes('balanceSheetHistory')) {
        return Promise.resolve({
          balanceSheetHistory: {
            balanceSheetStatements: [
              { longTermDebt: { raw: 100 }, totalAssets: { raw: 1000 }, goodWill: { raw: 100 } },
            ],
          },
        });
      }
      return Promise.resolve({});
    }),
    historical: jest.fn(() => Promise.resolve([{ date: '2024-01-01', close: 100 }])),
  },
}));

describe('GET /api/stock/[symbol]', () => {
  it('returns stock data and compliance for a valid symbol', async () => {
    // @ts-ignore
    const req = {} as NextRequest;
    const params = { params: { symbol: 'AAPL' } };
    const res = await GET(req, params);
    // @ts-ignore
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.symbol).toBe('AAPL');
    expect(json.compliance).toBeDefined();
    expect(json.info).toBeDefined();
    expect(json.financials).toBeDefined();
    expect(json.history).toBeDefined();
  });

  it('returns 400 if symbol is missing', async () => {
    // @ts-ignore
    const req = {} as NextRequest;
    const params = { params: { symbol: '' } };
    const res = await GET(req, params);
    // @ts-ignore
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe('Missing stock symbol');
  });
});