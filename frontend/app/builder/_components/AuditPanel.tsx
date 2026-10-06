"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — Accessibility +
// Performance, grouped under one "Audit" tab (both are read-only scan/report
// panels over data already on hand — distinct from History/Forms, which are
// operational data, not checks). The actual scan logic is pure and unit
// tested in lib/a11yCheck.ts / lib/performanceCheck.ts; this panel is just
// the fetch + list UI. Deliberately bounded: issues report the page/element,
// but there's no click-to-jump-and-select affordance into the canvas yet.

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { checkAccessibility, type A11yIssue } from "@/lib/a11yCheck";
import { checkPerformance, type PerfIssue, type AssetLike } from "@/lib/performanceCheck";
import type { ElementNode } from "@/types/builder";

interface PageLike { id: string; name: string; elements: ElementNode[] }

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function IssueRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 border border-gray-100 rounded-lg p-2.5 bg-gray-50">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-gray-800">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

function EmptyGood({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <CheckCircle2 size={22} className="text-green-400" />
      <p className="text-[12px] text-gray-400">{label}</p>
    </div>
  );
}

function AccessibilityTab({ pages }: { pages: PageLike[] }) {
  const issues = checkAccessibility(pages);
  if (issues.length === 0) return <EmptyGood label="No accessibility issues found." />;
  return (
    <div className="space-y-1.5">
      {issues.map((iss, i) => (
        <IssueRow
          key={i}
          icon={iss.severity === "error" ? <AlertCircle size={13} className="text-red-500" /> : <AlertTriangle size={13} className="text-amber-500" />}
          title={iss.message}
          detail={`${iss.pageName} · ${iss.elementId}`}
        />
      ))}
    </div>
  );
}

function PerformanceTab({ projectId, pages }: { projectId: string; pages: PageLike[] }) {
  const [assets, setAssets] = useState<AssetLike[] | null>(null);

  useEffect(() => {
    fetch(`${API}/api/assets?projectId=${projectId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setAssets(d.assets ?? []));
  }, [projectId]);

  if (assets === null) return <div className="text-[12px] text-gray-400 text-center py-10">Loading…</div>;

  const issues = checkPerformance(assets, pages);
  if (issues.length === 0) return <EmptyGood label="No image performance issues found." />;
  return (
    <div className="space-y-1.5">
      {issues.map((iss: PerfIssue, i: number) => (
        <IssueRow
          key={i}
          icon={iss.severity === "warning" ? <AlertTriangle size={13} className="text-amber-500" /> : <Info size={13} className="text-gray-400" />}
          title={iss.message}
          detail={iss.rule === "oversized-image" ? "Oversized image" : iss.rule === "legacy-format" ? "Legacy format" : "Unused asset"}
        />
      ))}
    </div>
  );
}

export default function AuditPanel({ projectId, pages }: { projectId: string; pages: PageLike[] }) {
  const [tab, setTab] = useState<"a11y" | "perf">("a11y");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex px-3 pt-2 gap-1 shrink-0">
        {([{ id: "a11y" as const, label: "Accessibility" }, { id: "perf" as const, label: "Performance" }]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${tab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "a11y" ? <AccessibilityTab pages={pages} /> : <PerformanceTab projectId={projectId} pages={pages} />}
      </div>
    </div>
  );
}
