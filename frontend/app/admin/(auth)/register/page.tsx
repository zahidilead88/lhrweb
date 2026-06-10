"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      router.push("/admin/login");
    } catch (err: any) { setError(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const INPUT = "w-full px-5 py-3.5 rounded-xl text-[14px] outline-none transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#111111" }}>
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#a8c7fa" }}>
            <span className="font-bold text-xl" style={{ color: "#111111" }}>L</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "#e8eaed" }}>LHRWEB</h1>
          <p className="text-[13px] mt-1" style={{ color: "#9aa0a6" }}>Create your administrator account</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-[18px] font-semibold mb-6" style={{ color: "#e8eaed" }}>Get Started</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Full Name</label>
              <input name="name" type="text" placeholder="John Doe" onChange={handleChange} required
                className={INPUT} style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>
            <div>
              <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Email Address</label>
              <input name="email" type="email" placeholder="name@company.com" onChange={handleChange} required
                className={INPUT} style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>
            <div>
              <label style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Password</label>
              <input name="password" type="password" placeholder="Min 6 characters" onChange={handleChange} required
                className={INPUT} style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
                <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-[14px] font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "#a8c7fa", color: "#111111" }}>
              {loading ? (
                <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(17,17,17,0.3)", borderTopColor: "#111111" }} />Creating account...</>
              ) : "Create Account"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>
            Already have an account?{" "}
            <button onClick={() => router.push("/admin/login")} className="font-semibold transition-colors"
              style={{ color: "#a8c7fa" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8eaed")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a8c7fa")}>
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
