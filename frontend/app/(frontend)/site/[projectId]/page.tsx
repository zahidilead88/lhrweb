"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutDashboard, ExternalLink, ChevronDown, Menu, X } from "lucide-react";
import BlockPreview from "@/app/builder/_components/BlockPreview";

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  styles?: Record<string, unknown>;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  blocks: Block[];
}

interface Project {
  _id: string;
  businessName: string;
  tagline: string;
  primaryColor: string;
  package: string;
  status: string;
  pages: Page[];
}

export default function SiteViewer({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const slugParam = searchParams.get("slug");

  useEffect(() => {
    fetch(`${API}/api/builder/public/${projectId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4 text-center">
        <p className="heading text-2xl font-black text-gray-800">Website not found</p>
        <p className="text-sm text-gray-400">This site may have been removed or the link is invalid.</p>
        <Link href="/dashboard" className="text-sm text-indigo-600 font-semibold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const activePage = project.pages.find((p) => p.slug === slugParam) ?? project.pages[0];
  const blocks = activePage?.blocks ?? [];

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden">

      {/* ── Top power strip ── */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <LayoutDashboard className="w-3 h-3" />
          </div>
          <span className="text-slate-400">Powered by <span className="text-white font-bold">LHR Web</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/builder?projectId=${project._id}`}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-full font-bold transition-all"
          >
            Edit Site
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors font-medium">
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Site nav bar ── */}
      <nav
        className="shrink-0 border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between"
        style={{ borderBottomColor: `${project.primaryColor}22` }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ backgroundColor: project.primaryColor || "#000" }}
          >
            {project.businessName?.[0]?.toUpperCase() ?? "W"}
          </div>
          <span className="font-black text-gray-900 text-sm">{project.businessName}</span>
        </div>

        {/* Desktop page links */}
        <div className="hidden md:flex items-center gap-1">
          {project.pages.map((page) => {
            const isActive = (activePage?.id === page.id);
            return (
              <Link
                key={page.id}
                href={`/site/${project._id}?slug=${page.slug}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={isActive ? { backgroundColor: project.primaryColor } : {}}
              >
                {page.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile nav dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 shrink-0">
          {project.pages.map((page) => {
            const isActive = activePage?.id === page.id;
            return (
              <Link
                key={page.id}
                href={`/site/${project._id}?slug=${page.slug}`}
                onClick={() => setMobileNavOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
                  isActive ? "text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: project.primaryColor } : {}}
              >
                {page.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        {blocks.length > 0 ? (
          <BlockPreview blocks={blocks} primaryColor={project.primaryColor} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
            <p className="text-4xl">🖼️</p>
            <p className="text-lg font-bold text-gray-700">This page is empty</p>
            <p className="text-sm text-gray-400">Open the builder to add content to this page.</p>
            <Link
              href={`/builder?projectId=${project._id}&pageId=${activePage?.id}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all mt-2"
            >
              Open Builder
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
