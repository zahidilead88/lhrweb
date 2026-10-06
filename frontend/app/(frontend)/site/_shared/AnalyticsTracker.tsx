"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — customer
// analytics. Fires one pageview event per real page load, public mode only
// (a "public" visit is a real visitor; "preview" is the site owner editing —
// tracking that would pollute their own numbers). `sendBeacon` is used when
// available so the request survives a fast navigation/unload; falls back to
// a keepalive fetch. Two client-generated IDs, both cheap and anonymous —
// no cookie-consent-grade PII, just enough to approximate uniqueness:
// a `visitorId` (localStorage — persists across visits) and a `sessionId`
// (sessionStorage — one per tab session).

import { useEffect } from "react";

const VISITOR_KEY = "lhrweb_visitor_id";
const SESSION_KEY = "lhrweb_session_id";

function randomId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreate(storage: Storage, key: string): string {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = randomId();
    storage.setItem(key, created);
    return created;
  } catch {
    return randomId();
  }
}

function classifyDevice(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function AnalyticsTracker({ projectId, pageKey }: { projectId: string; pageKey: string }) {
  useEffect(() => {
    const visitorId = getOrCreate(localStorage, VISITOR_KEY);
    const sessionId = getOrCreate(sessionStorage, SESSION_KEY);

    const payload = JSON.stringify({
      projectId,
      path: window.location.pathname,
      referrer: document.referrer,
      device: classifyDevice(),
      visitorId,
      sessionId,
    });

    const url = `${API}/api/analytics/track`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
    }
    // Re-fires once per real page change — `pageKey` (the active page's id, passed
    // by the caller) changes on navigation even when Next.js's client-side router
    // reuses this component's identity across a soft transition.
  }, [projectId, pageKey]);

  return null;
}
