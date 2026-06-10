"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BlockPreview from "../_components/BlockPreview";
import type { BlockStyles } from "@/lib/builderComponents";

interface Block   { id: string; type: string; content: Record<string, unknown>; styles?: BlockStyles; }
interface Page    { id: string; name: string; slug: string; blocks: Block[]; }
interface Project {
  _id: string; businessName: string; tagline: string;
  primaryColor: string; status: string; pages: Page[];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function PreviewContent() {
  const params    = useSearchParams();
  const projectId = params.get("id");
  const pageSlug  = params.get("page") ?? "home";

  const [project, setProject] = useState<Project | null>(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!projectId) { setError("No project ID."); return; }
    fetch(`${API}/api/builder/public/${projectId}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(setProject)
      .catch(() => setError("Could not load project."));
  }, [projectId]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-[15px]">{error}</p>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
        <p className="text-[13px] text-gray-400">Loading preview…</p>
      </div>
    </div>
  );

  const page   = project.pages.find((p) => p.slug === pageSlug) ?? project.pages[0];
  const blocks = page?.blocks ?? [];

  return (
    <>
      {/* Thin preview bar at top */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-5"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Preview</span>
          <span className="text-[11px] text-white/60">{project.businessName}</span>
        </div>
        <div className="flex items-center gap-2">
          {project.pages.map((p) => (
            <a
              key={p.id}
              href={`?id=${projectId}&page=${p.slug}`}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                p.slug === (page?.slug ?? "") ? "bg-white text-black" : "text-white/50 hover:text-white"
              }`}
            >
              {p.name}
            </a>
          ))}
        </div>
        <button
          onClick={() => window.close()}
          className="text-[11px] text-white/40 hover:text-white transition-colors"
        >
          Close ✕
        </button>
      </div>

      {/* Website content — starts after the 40px bar */}
      <div className="pt-10 min-h-screen">
        <BlockPreview
          blocks={blocks}
          primaryColor={project.primaryColor}
        />
      </div>

      {/* No blocks placeholder */}
      {blocks.length === 0 && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-gray-400 text-[15px]">This page has no blocks yet.</p>
        </div>
      )}
    </>
  );
}

export default function BuilderPreviewPage() {
  return (
    <Suspense>
      <PreviewContent />
    </Suspense>
  );
}
