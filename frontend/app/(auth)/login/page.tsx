"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { Link } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token, role } = await loginUser(email, password);
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      router.push("/admin"); // or dashboard
    } catch (err) {
      alert("Invalid login");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 mb-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 mb-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Login
      </button>

      {/* ✅ Register link */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Don’t have an account?{" "}
        <Link href="/admin/register" className="text-blue-600 hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
}
