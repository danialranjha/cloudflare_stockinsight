# Testing & Local Development Guide

This project uses **Jest** for unit and integration testing, and **Next.js** for local development.

## 1. Install Dependencies

```bash
npm install
```

## 2. Run All Tests

```bash
npm test
```

- Runs all unit and integration tests in the `src/` directory.
- Test files are named `*.test.ts`.

## 3. Run the Development Server

```bash
npm run dev
```

- Starts the Next.js development server.
- By default, the app runs at: [http://localhost:3000](http://localhost:3000)

## 4. Access the Application

Open your browser and go to:

```
http://localhost:3000
```

You can now use the Cloudflare StockInsight app locally.

---

**Notes:**
- Unit tests for Islamic Compliance logic are in [`src/lib/__tests__/islamicCompliance.test.ts`](src/lib/__tests__/islamicCompliance.test.ts).
- Integration tests for the stock API endpoint are in [`src/api/stock/[symbol]/route.test.ts`](src/api/stock/%5Bsymbol%5D/route.test.ts).
- No end-to-end or deployment tests are included in this guide.