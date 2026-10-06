"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 3 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §9) — Stripe Connect
// onboarding: one connected account per project, payouts go directly to the
// site owner. The backend already does the real Stripe API calls; this is
// the first UI that ever exposes them.

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { ModalShell } from "./AiModals";

interface Status { connected: boolean; onboarded: boolean; chargesEnabled: boolean }

export function PaymentsModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  const token = () => localStorage.getItem("token");

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/commerce/connect/${projectId}/status`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadStatus(); }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async () => {
    setRedirecting(true);
    setError("");
    try {
      const here = window.location.href;
      const res = await fetch(`${API}/api/commerce/connect/${projectId}/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ refreshUrl: here, returnUrl: here }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Failed to start Stripe onboarding."); return; }
      window.location.href = data.url;
    } catch {
      setError("Failed to start Stripe onboarding.");
    } finally {
      setRedirecting(false);
    }
  };

  return (
    <ModalShell title="Payments" icon={<CreditCard size={14} />} onClose={onClose}>
      {loading ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">Checking Stripe status…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[11.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
            Connect a Stripe account to accept payments on this site&rsquo;s storefront. Payouts go directly to your bank account — LHR Web takes a small platform fee per order, nothing more.
          </p>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200">
            {!status?.connected ? (
              <><span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" /><span className="text-[12px] font-semibold text-gray-500">Not connected</span></>
            ) : status.chargesEnabled ? (
              <><CheckCircle2 size={14} className="text-green-500 shrink-0" /><span className="text-[12px] font-semibold text-green-600">Connected — ready to accept payments</span></>
            ) : (
              <><Clock size={14} className="text-amber-500 shrink-0" /><span className="text-[12px] font-semibold text-amber-600">Onboarding started — not finished yet</span></>
            )}
          </div>

          {error && <p className="text-[11.5px] text-red-500">{error}</p>}

          <button
            onClick={connect}
            disabled={redirecting}
            className="w-full py-2.5 text-[12px] font-bold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {redirecting ? "Redirecting to Stripe…" : status?.connected ? "Continue Stripe setup" : "Connect with Stripe"}
            {!redirecting && <ExternalLink size={12} />}
          </button>

          {status?.connected && (
            <button onClick={loadStatus} className="w-full py-2 text-[11.5px] font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-all">
              Refresh status
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}
