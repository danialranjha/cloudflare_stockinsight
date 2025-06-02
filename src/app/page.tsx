"use client";
import React, { useState } from "react";
import StockInput from "@/components/StockInput";
import StockInfo from "@/components/StockInfo";
import StockFinancials from "@/components/StockFinancials";
import StockCompliance from "@/components/StockCompliance";
import StockChart from "@/components/StockChart";
import DownloadButton from "@/components/DownloadButton";

type ApiResponse = {
  symbol: string;
  info: any;
  financials: any;
  history: { date: string; close: number }[];
  compliance: { compliant: boolean; reasons: string[] };
};

export default function Home() {
  const [symbol, setSymbol] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (inputSymbol: string) => {
    setSymbol(inputSymbol);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/stock/${inputSymbol}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch data");
      }
      const result = await res.json();
      // Format history for chart
      const history = (result.history || []).map((pt: any) => ({
        date: pt.date,
        close: pt.close,
      }));
      setData({ ...result, history });
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>Cloudflare StockInsight</h1>
      <StockInput onSubmit={handleSearch} loading={loading} />
      {loading && <div style={{ textAlign: "center", margin: 24 }}>Loading...</div>}
      {error && <div style={{ color: "red", margin: 24, textAlign: "center" }}>{error}</div>}
      {data && (
        <>
          <StockInfo info={data.info} />
          <StockChart history={data.history} />
          <StockFinancials financials={data.financials} />
          <StockCompliance compliance={data.compliance} />
          <DownloadButton data={data} filename={`${data.symbol}-stockinsight.json`} />
        </>
      )}
      <footer style={{ marginTop: 48, textAlign: "center", color: "#888" }}>
        &copy; {new Date().getFullYear()} Cloudflare StockInsight
      </footer>
    </div>
  );
}
