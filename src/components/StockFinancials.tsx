import React from "react";

type StockFinancialsProps = {
  financials: {
    Long_Term_Debt: number;
    Total_Assets: number;
    Goodwill_And_Intangibles: number;
    // Add more fields as needed
  };
};

export default function StockFinancials({ financials }: StockFinancialsProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3>Key Financials</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold" }}>Long Term Debt</td>
            <td>${financials.Long_Term_Debt.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Total Assets</td>
            <td>${financials.Total_Assets.toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Goodwill & Intangibles</td>
            <td>${financials.Goodwill_And_Intangibles.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}