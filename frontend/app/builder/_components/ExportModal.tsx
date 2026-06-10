"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { useState } from "react";
import { X, Download, Code2, Globe, Database, FileCode2, CheckCircle2 } from "lucide-react";

interface Props {
  projectId: string;
  onClose: () => void;
}

type Stack    = "html" | "nextjs" | "laravel";
type Database = "none" | "mongodb" | "mysql";

const STACKS: { id: Stack; label: string; desc: string; icon: string; dbs: Database[] }[] = [
  {
    id: "html",
    label: "HTML / CSS / JS",
    desc: "Pure static site. No build tools. Works everywhere.",
    icon: "🌐",
    dbs: ["none"],
  },
  {
    id: "nextjs",
    label: "Next.js",
    desc: "React + App Router + Tailwind CSS. Deploy on Vercel instantly.",
    icon: "▲",
    dbs: ["none", "mongodb", "mysql"],
  },
  {
    id: "laravel",
    label: "Laravel",
    desc: "PHP + Blade templates. Classic server-rendered web app.",
    icon: "🔴",
    dbs: ["none", "mysql"],
  },
];

const DB_LABELS: Record<Database, string> = {
  none:    "No Database",
  mongodb: "MongoDB",
  mysql:   "MySQL",
};

export default function ExportModal({ projectId, onClose }: Props) {
  const [stack,    setStack]    = useState<Stack>("nextjs");
  const [database, setDatabase] = useState<Database>("none");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const selectedStack = STACKS.find(s => s.id === stack)!;

  function handleStackChange(s: Stack) {
    setStack(s);
    const def = STACKS.find(x => x.id === s)!;
    if (!def.dbs.includes(database)) setDatabase(def.dbs[0]);
    setDone(false);
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ projectId, stack, database }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "website.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Download size={18} className="text-[#6344d4]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Export Website Code</p>
              <p className="text-xs text-gray-400">Download as a runnable project</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stack selection */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Choose Stack</p>
            <div className="grid gap-3">
              {STACKS.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStackChange(s.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    stack === s.id
                      ? "border-[#6344d4] bg-purple-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${stack === s.id ? "text-[#6344d4]" : "text-gray-800"}`}>{s.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                  {stack === s.id && <CheckCircle2 size={18} className="text-[#6344d4] flex-shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Database selection (hidden for html with only "none") */}
          {selectedStack.dbs.length > 1 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Database</p>
              <div className="flex gap-2">
                {selectedStack.dbs.map(db => (
                  <button
                    key={db}
                    onClick={() => { setDatabase(db); setDone(false); }}
                    className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      database === db
                        ? "border-[#6344d4] bg-purple-50 text-[#6344d4]"
                        : "border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {DB_LABELS[db]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* What's included */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">What's included</p>
            <ul className="space-y-1">
              {getIncludes(stack, database).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-[#6344d4]">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: "#6344d4" }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
            ) : done ? (
              <><CheckCircle2 size={16} /> Downloaded! Download Again</>
            ) : (
              <><Download size={16} /> Download ZIP</>
            )}
          </button>
          {done && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Check the README.md inside the zip for setup instructions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getIncludes(stack: Stack, db: Database): string[] {
  const base: Record<Stack, string[]> = {
    html: [
      "index.html + one file per page",
      "assets/style.css — full custom CSS",
      "assets/main.js — FAQ accordion, nav toggle, contact form",
      "README.md — how to open & deploy",
    ],
    nextjs: [
      "Next.js 14 App Router project",
      "TypeScript + Tailwind CSS configured",
      "One component per section type",
      "App layout with navigation & footer",
      "Contact API route (/api/contact)",
      "README.md — install, run, deploy to Vercel",
    ],
    laravel: [
      "Laravel 10 project structure",
      "Blade templates for every page",
      "Controllers + web routes wired up",
      "public/css/style.css — full custom CSS",
      "Contact form with CSRF + validation",
      "README.md — composer install & deploy",
    ],
  };
  const dbExtras: Partial<Record<Database, string[]>> = {
    mongodb: ["lib/mongodb.ts — Mongoose connection", ".env.example with MONGODB_URI"],
    mysql:   stack === "nextjs"
      ? ["Prisma schema + client setup", "database/migrations for contacts", ".env.example with DATABASE_URL"]
      : ["Migration for contacts table", "Contact Eloquent model", ".env.example with DB_ config"],
  };
  return [...base[stack], ...(dbExtras[db] || [])];
}
