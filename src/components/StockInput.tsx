import React, { useState } from "react";

type StockInputProps = {
  onSubmit: (symbol: string) => void;
  loading: boolean;
};

export default function StockInput({ onSubmit, loading }: StockInputProps) {
  const [symbol, setSymbol] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSubmit(symbol.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      <input
        type="text"
        placeholder="Enter stock symbol (e.g. AAPL)"
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        disabled={loading}
        style={{ flex: 1, padding: 8, fontSize: 16 }}
        aria-label="Stock symbol"
      />
      <button type="submit" disabled={loading || !symbol.trim()} style={{ padding: "8px 16px", fontSize: 16 }}>
        {loading ? "Loading..." : "Search"}
      </button>
    </form>
  );
}