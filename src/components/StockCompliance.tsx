import React from "react";

type ComplianceResult = {
  compliant: boolean;
  reasons: string[];
};

type StockComplianceProps = {
  compliance: ComplianceResult;
};

export default function StockCompliance({ compliance }: StockComplianceProps) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3>Islamic Compliance Status</h3>
      <div
        style={{
          color: compliance.compliant ? "green" : "red",
          fontWeight: "bold",
          fontSize: 18,
          marginBottom: 8,
        }}
      >
        {compliance.compliant ? "Compliant" : "Not Compliant"}
      </div>
      {!compliance.compliant && (
        <ul>
          {compliance.reasons.map((reason, idx) => (
            <li key={idx}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  );
}