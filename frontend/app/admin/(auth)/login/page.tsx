"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
      if (data.package) localStorage.setItem("package", data.package);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#111111" }}
    >
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "#a8c7fa" }}
          >
            <span className="text-black font-black text-[16px]">L</span>
          </div>
          <h1 className="text-[18px] font-semibold" style={{ color: "#e8eaed" }}>LHRWEB</h1>
          <p className="text-[13px] mt-1" style={{ color: "#9aa0a6" }}>Sign in to your admin panel</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-[11px] font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "#9aa0a6" }}
              >
                Email address
              </label>
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e8eaed",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  className="block text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "#9aa0a6" }}
                >
                  Password
                </label>
                <Link href="#" className="text-[11px] transition-colors" style={{ color: "#9aa0a6" }}>
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-[13px] outline-none transition-all"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e8eaed",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2"
                style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}
              >
                <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 mt-2"
              style={{ background: "#a8c7fa", color: "#111111" }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#111" }} />
                  Verifying...
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] mt-6" style={{ color: "#9aa0a6" }}>
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/admin/register")}
            className="font-semibold transition-colors"
            style={{ color: "#a8c7fa" }}
          >
            Request access
          </button>
        </p>
      </div>
    </div>
  );
}
