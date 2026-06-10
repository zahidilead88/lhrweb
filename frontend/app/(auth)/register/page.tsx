"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", package: "builder" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      // Redirect to client login page
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-[440px]">
        
        {/* Header indicator */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-black block" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Client Portal</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Create Account</h1>
          <p className="text-xs text-gray-400 mt-1">Get started with your custom digital solutions</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                onChange={handleChange}
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                onChange={handleChange}
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <input
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                onChange={handleChange}
                required
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Select Plan / Package</label>
              <select
                name="package"
                value={form.package}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all outline-none cursor-pointer appearance-none"
              >
                <option value="builder">Website Builder Package</option>
                <option value="starter">Starter Standard Package</option>
                <option value="pro">Pro Enterprise Package</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full text-[11px]">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-2xl text-[13px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : "Register Account"}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-black hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
