"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/10">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">LHRWEB</h1>
          <p className="text-[13px] text-gray-400 mt-2">Sign in to manage your digital presence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Welcome back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                  <Link href="#" className="text-[11px] font-bold text-gray-300 hover:text-black transition-colors uppercase tracking-wider">Forgot?</Link>
                </div>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[13px] font-medium animate-in fade-in slide-in-from-top-1">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-[12px]">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/admin/register")}
              className="font-bold text-gray-900 hover:underline"
            >
              Request access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
