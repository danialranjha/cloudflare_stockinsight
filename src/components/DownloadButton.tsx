import React from "react";

type DownloadButtonProps = {
  data: object;
  filename?: string;
};

export default function DownloadButton({ data, filename = "stockinsight-data.json" }: DownloadButtonProps) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleDownload} style={{ padding: "8px 16px", fontSize: 16, marginTop: 12 }}>
      Download Data
    </button>
  );
}