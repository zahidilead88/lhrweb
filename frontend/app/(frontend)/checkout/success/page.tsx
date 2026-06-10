"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export default function CheckoutSuccessPage() {
  const router   = useRouter();
  const [secs, setSecs] = useState(5);

  useEffect(() => {
    if (secs <= 0) { router.push("/dashboard"); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <div>
          <h1 className="heading text-2xl font-black text-slate-900 mb-2">You&apos;re all set!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your subscription is now active. Head to your dashboard to start building your website with AI.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100 text-left space-y-3">
          {[
            ["AI Website Generator", "Describe your business and get a full site instantly"],
            ["Page Editor",          "Drag blocks, edit content, change colours"],
            ["Publish",              "Go live on your subdomain in one click"],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-slate-400">Redirecting automatically in {secs}s…</p>
      </div>
    </div>
  );
}
