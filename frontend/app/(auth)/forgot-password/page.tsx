"use client";
import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await fetch(`${API}/api/admin/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 32, background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Forgot password</h1>
        {sent ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            If that email is registered, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Email address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }}
                placeholder="you@example.com"
              />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
            <button disabled={loading} style={{ padding: "11px", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
