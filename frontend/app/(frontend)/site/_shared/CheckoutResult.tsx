"use client";

// Phase 3 §9.5 — order confirmation. Deliberately minimal: no order lookup by
// Stripe session id (that would need a new public order-read route and widens
// the public API surface for little benefit at this stage) — just an honest
// "payment received, the store owner has your order" confirmation.

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

export function CheckoutSuccess({ businessName, continueHref }: { businessName: string; continueHref: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4 text-center px-6">
      <CheckCircle2 className="w-14 h-14 text-green-500" />
      <p className="text-2xl font-black text-gray-900">Thank you for your order!</p>
      <p className="text-sm text-gray-500 max-w-sm">Your payment to {businessName} was received. You&rsquo;ll get a confirmation from them shortly.</p>
      <Link href={continueHref} className="mt-2 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all">
        Continue shopping
      </Link>
    </div>
  );
}

export function CheckoutCancel({ continueHref }: { continueHref: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4 text-center px-6">
      <XCircle className="w-14 h-14 text-gray-300" />
      <p className="text-2xl font-black text-gray-900">Checkout cancelled</p>
      <p className="text-sm text-gray-500 max-w-sm">You haven&rsquo;t been charged. Your cart is still saved.</p>
      <Link href={continueHref} className="mt-2 inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all">
        Back to store
      </Link>
    </div>
  );
}
