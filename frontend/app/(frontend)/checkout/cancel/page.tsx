"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>

        <div>
          <h1 className="heading text-2xl font-black text-slate-900 mb-2">Payment cancelled</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            No worries — you haven&apos;t been charged. You can go back and try again whenever you&apos;re ready.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/pricing")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
