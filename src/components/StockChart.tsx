import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type PricePoint = {
  date: string;
  close: number;
};

type StockChartProps = {
  history: { date: string; close: number }[];
};

export default function StockChart({ history }: StockChartProps) {
  // Format data for chart (ensure date is string and close is number)
  const data = history.map((pt) => ({
    date: pt.date.slice(0, 10),
    close: pt.close,
  }));

  return (
    <section style={{ marginBottom: 24 }}>
      <h3>Price History (1 Year)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={30} />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="#0070f3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}