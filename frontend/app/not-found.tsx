import Link from "next/link";
export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, margin: 0 }}>404</h1>
      <p style={{ color: "#6b7280", fontSize: 16, margin: 0 }}>This page could not be found.</p>
      <Link href="/" style={{ padding: "10px 24px", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
        Go Home
      </Link>
    </div>
  );
}
