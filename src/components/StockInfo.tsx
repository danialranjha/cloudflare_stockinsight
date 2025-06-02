import React from "react";

type StockInfoProps = {
  info: {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    summary: string;
    marketCap: number;
  };
};

export default function StockInfo({ info }: StockInfoProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2>
        {info.name} ({info.symbol})
      </h2>
      <div>
        <strong>Sector:</strong> {info.sector || "N/A"} &nbsp;|&nbsp;
        <strong>Industry:</strong> {info.industry || "N/A"}
      </div>
      <div>
        <strong>Market Cap:</strong> {info.marketCap ? `$${info.marketCap.toLocaleString()}` : "N/A"}
      </div>
      <p style={{ marginTop: 12 }}>{info.summary}</p>
    </section>
  );
}