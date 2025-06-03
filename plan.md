# Cloudflare StockInsight Migration & Deployment Plan

This document provides a comprehensive plan for porting the Streamlit-based StockInsight app to Cloudflare, deploying it as a modern JavaScript/TypeScript (Next.js or similar) application on Cloudflare Pages, and setting up CI/CD with GitHub Actions.

---

## 1. Migration Plan: Streamlit (Python) to Cloudflare (Next.js/JS/TS)

### 1.1. Assessment & Preparation

#### Audit of Current Streamlit App

**User-Facing Features:**
- Search for a stock symbol and display historical price data, financials, and company info.
- Visualize stock price history and financial ratios using interactive charts (Plotly).
- Islamic compliance screening: show whether a stock is compliant based on financial and business criteria.
- Download processed data for offline analysis.
- Responsive UI with loading spinners and multi-column layout.

**Data Flows:**
- User inputs a stock symbol via the Streamlit UI.
- App fetches data from Yahoo Finance using yfinance (with retry and rate limiting).
- Financial data and company info are processed for display and compliance checks.
- Results (charts, compliance status, download links) are rendered in the UI.
- Caching is used to reduce redundant API calls.

**Core Functionality:**
- Data fetching: yfinance for stock/financial data.
- Data processing: pandas for manipulation, custom logic for compliance.
- Caching: in-memory with TTL (custom decorators), requests_cache (optional).
- UI: Streamlit for interactive web interface.
- No explicit authentication implemented.

**Python Libraries Used:**
- streamlit, yfinance, pandas, plotly, requests_cache, functools, threading, logging.

#### Islamic Compliance Screening Implementation Assessment

**Screening Criteria & Thresholds:**
- **Financial Ratios:**  
  - *Debt Ratio*: Calculated using `calculate_debt_ratio(financial_data)`. Must be **less than 33%** of market capitalization to be compliant.
  - *Liquidity Ratio*: (Cash + Short/Long Term Investments) / Market Cap × 100. Must be **less than 33%**.
  - *Receivables Ratio*: Net Receivables / Market Cap × 100. Must be **less than 33%**.
- **Business Activity Exclusions:**  
  - Explicitly screens out companies involved in: alcohol, gambling, tobacco, prohibited food (pork), weapons, adult entertainment, and interest-based financial services (e.g., banks, insurance, asset management).
  - Exclusions are based on keywords in company name, sector, industry, and business summary.

##### Detailed Financial Ratio Algorithms (as implemented)

**1. Debt Ratio**
- **Inputs:**  
  - `financial_data['Long_Term_Debt']`: Long-term debt (from balance sheet, e.g., yfinance).
  - `financial_data['Total_Assets']`: Total assets (from balance sheet).
  - `financial_data['Goodwill_And_Intangibles']`: Goodwill and intangible assets (from balance sheet).
- **Formula:**  
  - Adjusted Assets = `Total_Assets - Goodwill_And_Intangibles`
  - Debt Ratio = (`Long_Term_Debt` / Adjusted Assets) × 100
- **Edge Cases:**  
  - If Adjusted Assets ≤ 0, returns `None` (debt compliance check will fail).
  - If any input is missing, a KeyError may occur upstream.
- **Output:**  
  - Rounded float (2 decimals), e.g., 12.34.
  - Used to set `is_debt_compliant = (debt_ratio < 33)`. If `debt_ratio` is `None`, compliance is `False`.

**2. Liquidity Ratio**
- **Inputs:**  
  - `info['totalCash']`: Total cash (from yfinance info dict).
  - `info['shortTermInvestments']`: Short-term investments.
  - `info['longTermInvestments']`: Long-term investments.
  - `info['marketCap']`: Market capitalization.
- **Formula:**  
  - Cash & Investments = `totalCash + shortTermInvestments + longTermInvestments`
  - Liquidity Ratio = (Cash & Investments / Market Cap) × 100
- **Edge Cases:**  
  - If `marketCap` ≤ 0 or missing, ratio is set to 0 and compliance defaults to `True`.
  - Missing cash/investment fields default to 0.
- **Output:**  
  - Rounded float (2 decimals).
  - Used to set `is_liquidity_compliant = (liquidity_ratio < 33)`.

**3. Receivables Ratio**
- **Inputs:**  
  - `info['netReceivables']`: Net receivables (from yfinance info dict).
  - `info['marketCap']`: Market capitalization.
- **Formula:**  
  - Receivables Ratio = (`netReceivables` / Market Cap) × 100
- **Edge Cases:**  
  - If `marketCap` ≤ 0 or missing, ratio is set to 0 and compliance defaults to `True`.
  - Missing `netReceivables` defaults to 0.
- **Output:**  
  - Rounded float (2 decimals).
  - Used to set `is_receivables_compliant = (receivables_ratio < 33)`.

**4. Aggregation and Compliance Decision**
- All three ratios are calculated in `calculate_ratios(financial_data, info)`, which returns both the ratio values and compliance flags.
- The main entry point, `calculate_islamic_ratios(financial_data, info)`, combines these with business practice checks.
- **Final Output:**  
  - `is_fully_compliant` is `True` only if all three ratio compliance flags and the business practice flag are `True`.
  - On any calculation error, the function returns `None` and logs the error.
**Data Inputs & Processing:**
- Requires two main inputs:
  - `financial_data`: Used for debt ratio calculation (via [`utils/calculations.py`](utils/calculations.py)).
  - `info`: Dictionary with keys like `marketCap`, `totalCash`, `shortTermInvestments`, `longTermInvestments`, `netReceivables`, `sector`, `industry`, `longName`, `longBusinessSummary`.
- Ratios are computed only if `marketCap` is present and > 0. Defaults are set for missing data.

**Compliance Logic:**
- A company is considered **fully compliant** if:
  - All three financial ratios are below 33%.
  - No business activity exclusions are triggered.
- The main entry point is `calculate_islamic_ratios(financial_data, info)`, which returns a combined result of ratio checks and business practice screening.
- Business practice screening uses extensive keyword lists and industry/sector checks to flag non-compliance.

**Outputs & Flags:**
- Returns a dictionary with:
  - `debt_ratio`, `liquidity_ratio`, `receivables_ratio` (rounded floats)
  - `is_debt_compliant`, `is_liquidity_compliant`, `is_receivables_compliant` (bools)
  - `is_business_compliant` (bool)
  - `non_compliant_reasons` (list of strings, if any)
  - `is_fully_compliant` (bool, true only if all criteria are met)

**Dependencies & Integration Points:**
- Depends on [`utils/calculations.py`](utils/calculations.py) for debt ratio calculation.
- Expects `info` and `financial_data` to be populated from upstream data sources (e.g., Yahoo Finance via yfinance).
- Designed for integration with the main app logic, where compliance status and reasons are displayed to the user.

**Actionable Notes for Migration:**
- All ratio formulas and business exclusion logic must be ported to JS/TS with equivalent data structures.
- Keyword and threshold logic should be preserved for parity.
- Ensure upstream data fetching provides all required fields for compliance checks.
**Cloudflare-Compatible Equivalents:**
- UI: Next.js (React) for frontend.
- Backend/API: Cloudflare Functions (API Routes in Next.js).
- Data Fetching: Use JS/TS libraries (e.g., Yahoo Finance APIs, fetch, axios).
- Caching: Cloudflare KV, Durable Objects, or stateless in-memory (if appropriate).
- Auth: Cloudflare Access or third-party (if needed).
### 1.2. Project Structure

- Create a new Next.js (or similar) project.
- Organize code into:
  - `/pages` (or `/app` for Next.js 13+): UI routes.
  - `/api`: API endpoints (Cloudflare Functions).
  - `/components`: Reusable UI components.
  - `/lib` or `/utils`: Utility functions (e.g., data fetching, calculations).
  - `/public`: Static assets.

### 1.3. Porting Logic

- **Rewrite Python logic in TypeScript/JavaScript**:
  - Data fetching: Use `fetch` or `axios` for HTTP APIs.
  - Calculations: Port logic from Python to JS/TS.
  - Caching: Use Cloudflare KV or in-memory cache.
- **UI**: Rebuild Streamlit UI in React components.
- **API Endpoints**: Move backend logic to `/api` routes using Cloudflare Functions.

### 1.4. Environment Variables & Secrets

#### Required Environment Variables

- `CLOUDFLARE_API_KEY`: Cloudflare API token with permissions for Pages and Secrets.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.

#### Where to Set These Variables

- **Local Development:**
  Add the following to your `.env.local` file (never commit this file to git):
  ```
  CLOUDFLARE_API_KEY=your-cloudflare-api-key
  CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
  ```
- **Production (Cloudflare Pages):**
  Set these variables in the Cloudflare Pages dashboard under "Settings" > "Environment Variables".
- **CI/CD (GitHub Actions):**
  Add these as GitHub Secrets (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`) in your repository settings.

- Use `.env` for local development.
- Use Cloudflare dashboard for production secrets.

### 1.5. Testing & Validation

- Write unit and integration tests (Jest, React Testing Library).
- Validate feature parity with the original app.

---

## 2. Deploying Next.js App to Cloudflare Pages

### 2.1. Project Setup

- Initialize Next.js project:
  ```bash
  npx create-next-app@latest cloudflare-stockinsight
  cd cloudflare-stockinsight
  ```
- Add TypeScript (optional but recommended):
  ```bash
  touch tsconfig.json
  npm install --save-dev typescript @types/react @types/node
  ```

### 2.2. Cloudflare Pages Configuration

- **Create a Cloudflare Pages project** via the Cloudflare dashboard.
- **Connect your GitHub repository**.

#### 2.2.1. Using Cloudflare Functions (API Routes)

- Place API logic in `/pages/api/` (Next.js) or `/functions/` (for vanilla Cloudflare Functions).
- Example: [`pages/api/stock.ts`](cloudflare-stockinsight/pages/api/stock.ts)
- Cloudflare will automatically deploy these as serverless functions.

#### 2.2.2. Managing Secrets/Environment Variables

- **Local Development**: Use `.env.local` (never commit to git).
- **Production**: Set environment variables in the Cloudflare Pages dashboard under "Settings" > "Environment Variables".
- **Access in Code**: Use `process.env.MY_SECRET` (Next.js).

#### 2.2.3. Required Configuration Files

- **`wrangler.toml`** (for advanced configuration, KV, Durable Objects, etc.):
  ```toml
  name = "cloudflare-stockinsight"
  main = "functions/index.ts"
  compatibility_date = "2024-05-30"

  [env.production]
  vars = { CLOUDFLARE_API_KEY = "your-api-key", CLOUDFLARE_ACCOUNT_ID = "your-account-id" }
  ```

- **`package.json`**: Ensure build scripts are correct:
  ```json
  {
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start"
    }
  }
  ```

#### 2.2.4. Using Cloudflare API Token

- **Create a Cloudflare API Token** with permissions for Pages and Secrets.
- **Store the token as a GitHub Actions secret** named `CLOUDFLARE_API_KEY`.
- **Store your Cloudflare Account ID as a GitHub Actions secret** named `CLOUDFLARE_ACCOUNT_ID`.
- **Use these secrets in CI/CD for deployments and secret management**.

#### 2.2.5. Deployment Steps

1. **Push code to GitHub**.
2. **Cloudflare Pages auto-builds and deploys** on push (or use GitHub Actions for more control).
3. **Manual deployment** (optional):
   ```bash
   npx wrangler pages deploy ./out --project-name=cloudflare-stockinsight --branch=main --api-token=$CF_API_TOKEN
   ```

#### 2.2.6. Migration Caveats & Tips

- **Python to JS/TS**: Some libraries (e.g., yfinance) may not have direct JS equivalents; use public APIs or npm packages.
- **Stateful logic**: Use Cloudflare KV or Durable Objects for persistent state.
- **Cold starts**: Cloudflare Functions are fast, but design for statelessness.
- **No direct file system access**: Use KV or R2 for storage.
- **Testing**: Use local emulators (`wrangler dev`) for Cloudflare Functions.

---

## 3. Example GitHub Actions Workflow for Cloudflare Pages Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      NODE_VERSION: 20

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Publish to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_KEY }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cloudflare-stockinsight
          directory: .next
          branch: main
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          # Add other env vars as needed

```

**Required GitHub Secrets:**
- `CLOUDFLARE_API_KEY`: Cloudflare API token with Pages and Secrets permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.
- Any app-specific secrets (e.g., `NEXT_PUBLIC_API_URL`).

---

## 4. Best Practices & References

### 4.1. Best Practices

- **Keep secrets out of source control**: Use `.env.local` for dev, Cloudflare dashboard for prod.
- **Use TypeScript**: For type safety and maintainability.
- **Modularize code**: Separate UI, API, and utility logic.
- **Test locally**: Use `wrangler dev` for Cloudflare Functions.
- **Monitor deployments**: Use Cloudflare Analytics and GitHub Actions logs.
- **Automate deployments**: Use CI/CD for consistent, repeatable releases.

### 4.2. References

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions Docs](https://developers.cloudflare.com/pages/functions/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Cloudflare Pages](https://github.com/cloudflare/pages-action)
- [Migrating from Python to JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Python_to_JavaScript)

---

## 5. Summary Checklist

- [ ] Audit and port all app logic from Python to JS/TS.
- [ ] Rebuild UI in React (Next.js).
- [ ] Implement backend logic as Cloudflare Functions.
- [ ] Set up environment variables and secrets (`CLOUDFLARE_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`) in all required locations (local `.env`, Cloudflare dashboard, GitHub Secrets).
- [ ] Configure `wrangler.toml` if using KV, Durable Objects, etc.
- [ ] Set up Cloudflare Pages project and connect GitHub repo.
- [ ] Add GitHub Actions workflow for CI/CD.
- [ ] Test thoroughly before production deployment.

---

This plan provides all necessary steps and references for a successful migration and deployment of the StockInsight app to Cloudflare using modern JS/TS tooling and CI/CD best practices.