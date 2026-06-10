"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || `${API}`;

const PLANS = [
  {
    id:        "starter",
    name:      "Starter",
    quarterly: 29,
    annual:    23,
    discount:  "20%",
    currency:  "$",
    features: [
      "AI-powered website generation",
      "Up to 5 pages",
      "Core block types",
      "Custom colours & branding",
      "Publish to subdomain",
      "Mobile responsive",
      "Email support",
    ],
  },
  {
    id:        "pro",
    name:      "Pro",
    quarterly: 79,
    annual:    63,
    discount:  "20%",
    currency:  "$",
    features: [
      "Everything in Starter",
      "Up to 15 pages",
      "All block types",
      "Custom domain support",
      "Priority AI generation",
      "Advanced SEO settings",
      "Analytics dashboard",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [annualMap, setAnnualMap] = useState<Record<string, boolean>>(
    Object.fromEntries(PLANS.map((p) => [p.id, true]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState("");

  const toggle = (planId: string) =>
    setAnnualMap((prev) => ({ ...prev, [planId]: !prev[planId] }));

  const handleBuy = async (planId: string) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login?redirect=/pricing"); return; }
    setLoading(planId); setError("");
    try {
      const res  = await fetch(`${API}/api/subscriptions/checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: planId, billing: annualMap[planId] ? "annual" : "quarterly" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-20 flex flex-col items-center">

      {/* Page heading */}
      <div className="text-center mb-14">
        <h1 className="heading text-4xl md:text-5xl font-black tracking-tight text-black mb-3">
          Simple, honest pricing.
        </h1>
        <p className="text-gray-400 text-base max-w-md mx-auto">
          Pick a plan. Build your website. Cancel anytime.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-5 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm text-center max-w-lg">
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {PLANS.map((plan) => {
          const isAnnual  = annualMap[plan.id];
          const price     = isAnnual ? plan.annual : plan.quarterly;
          const isLoading = loading === plan.id;

          return (
            <div key={plan.id} className="flex flex-col gap-3">

              {/* Plan name — outside the card */}
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-gray-400 px-1">
                {plan.name}
              </p>

              <div
                className="rounded-[28px] bg-white flex flex-col relative"
              >
                <div className="px-8 pt-8 pb-6 flex flex-col border border-gray-300 border-b-0 rounded-[28px]">

                  {/* Per-card billing toggle */}
                  <div className="flex items-center gap-3 mb-8">
                    <span
                      className="text-[14px] font-semibold cursor-pointer select-none"
                      style={{ color: isAnnual ? "#aaa" : "#000" }}
                      onClick={() => toggle(plan.id)}
                    >
                      Quarterly
                    </span>
                    <button
                      onClick={() => toggle(plan.id)}
                      className="relative w-11 h-6 rounded-full bg-white border border-black transition-colors duration-200 flex-shrink-0"
                      aria-label="Toggle billing"
                    >
                      <span
                        className="absolute w-4 h-4 rounded-full bg-black transition-all duration-200"
                        style={{ top: "50%", transform: "translateY(-50%)", left: isAnnual ? "calc(100% - 20px)" : "4px" }}
                      />
                    </button>
                    <span
                      className="relative cursor-pointer select-none leading-none"
                      style={{ color: isAnnual ? "#000" : "#aaa" }}
                      onClick={() => toggle(plan.id)}
                    >
                      <span className="text-[14px] font-semibold">Annual</span>
                      <span className="absolute -top-2.5 -right-5 text-[9px] font-bold">-{plan.discount}</span>
                    </span>
                  </div>

                  {/* Big price */}
                  <div className="mb-2">
                    <span
                      className="heading font-black leading-none tracking-tighter"
                      style={{ fontSize: "clamp(72px, 14vw, 96px)" }}
                    >
                      {plan.currency}{price}
                    </span>
                  </div>

                  {/* Period */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400 mb-8">
                    per month{isAnnual ? ", billed annually" : ", billed quarterly"}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={isLoading}
                    className="w-full py-4 rounded-full text-[13px] font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "#c8f135", color: "#000" }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        Get Started
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <path d="M14 4.24V.47C14 .35 13.95.23 13.86.14 13.77.05 13.65 0 13.53 0H9.76c-.09 0-.18.03-.25.08-.08.05-.14.13-.17.21-.04.09-.04.18-.02.27.02.09.07.17.13.23L11.98 2.36 0 13.33l.67.67 10.97-10.97 1.55 1.55c.07.07.15.11.24.13.09.02.18.01.27-.03.08-.04.15-.1.2-.18.05-.07.08-.16.08-.25Z" fill="currentColor"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Ticket separator */}
                <div className="relative flex items-center">
                  {/* Left notch — half outside card, half inside */}
                  {/* <div className="absolute rounded-full flex-shrink-0" style={{ width: 32, height: 32, left: -16, background: "#fff", border: "1.5px solid #e8e8e8", zIndex: 10 }} /> */}
                  {/* Dashed line between notches */}
                  <div className="flex-1" style={{ borderTop: "1.5px dashed #d4d4d4", marginLeft: 16, marginRight: 16 }} />
                  {/* Right notch */}
                  {/* <div className="absolute rounded-full flex-shrink-0" style={{ width: 32, height: 32, right: -16, background: "#fff", border: "1.5px solid #e8e8e8", zIndex: 10 }} /> */}
                </div>

                {/* Tax footnote */}
                <div className="px-8 py-5 border border-gray-300 border-t-0 rounded-[28px]">
                  <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-gray-400 leading-relaxed text-center">
                    Taxes (if applicable) will be calculated at checkout.
                    VAT will be determined based on your billing location
                    and VAT number, if provided.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features comparison */}
      <div className="w-full max-w-2xl mt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="px-8">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-4 px-1">
                {plan.name} — What&apos;s included
              </p>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[13px] text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-black flex-shrink-0 flex items-center justify-center">
                      <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom trust line */}
      <p className="mt-12 text-[12px] text-gray-400 text-center">
        Secure checkout via Stripe · Cancel anytime · No hidden fees
      </p>
    </div>
  );
}
