"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#e8eaed" }}>Something went wrong</h2>
      <p style={{ color: "#9aa0a6", fontSize: 13 }}>{error.message}</p>
      <button onClick={reset} style={{ padding: "8px 20px", background: "rgba(168,199,250,0.1)", color: "#a8c7fa", border: "1px solid rgba(168,199,250,0.2)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
        Try again
      </button>
    </div>
  );
}
