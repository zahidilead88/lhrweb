"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe, LogOut, ArrowUpRight, User, Mail, Plus, Trash2,
  Sparkles, CheckCircle2, HeadphonesIcon, ExternalLink, Package,
  LayoutDashboard, CreditCard, Calendar, AlertTriangle, Building2,
} from "lucide-react";
import AgencyPanel from "./_components/AgencyPanel";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Project {
  _id: string;
  businessName: string;
  tagline: string;
  primaryColor: string;
  package: string;
  status: string;
  pages: Array<{ id: string; name: string; slug: string }>;
  prompt?: string;
  updatedAt: string;
  // Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — present when an
  // agency owner/team member is viewing a project shared via their agency
  // rather than one they personally created.
  userId?: string;
  agencyId?: string | null;
}

type NavItem = "websites" | "agency" | "billing" | "profile" | "support";

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:       "#F8F9FA",
  surface:  "#FFFFFF",
  border:   "#E8EAED",
  text:     "#202124",
  muted:    "#5F6368",
  accent:   "#6344d4",
  accentBg: "rgba(99,68,212,0.08)",
  hover:    "#F1F3F4",
};

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [userName, setUserName]         = useState("Client");
  const [userEmail, setUserEmail]       = useState("");
  const [userPackage, setUserPackage]   = useState("");
  const [projects, setProjects]         = useState<Project[]>([]);
  const [activeNav, setActiveNav]       = useState<NavItem>("websites");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/builder/projects`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch { /* silent */ }
    finally   { setLoading(false); }
  };

  const fetchSubscription = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/subscriptions/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSubscription(await res.json());
    } catch { /* silent */ }
  };

  const openBillingPortal = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setPortalLoading(true);
    try {
      const res  = await fetch(`${API}/api/subscriptions/portal`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert("Failed to open billing portal. Please try again."); }
    finally { setPortalLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    if (!token || role === "admin") { router.push("/login"); return; }
    setUserName(localStorage.getItem("name") || "Client");
    setUserEmail(localStorage.getItem("email") || "");
    setUserPackage(localStorage.getItem("package") || "");
    fetchProjects();
    fetchSubscription();
  }, [router]);

  useEffect(() => {
    if (!projects.some((p) => p.status === "generating")) return;
    const id = setInterval(fetchProjects, 4000);
    return () => clearInterval(id);
  }, [projects]);

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this website permanently? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/builder/project/${projectId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch { alert("Failed to delete. Please try again."); }
  };

  const handleLogout = () => {
    ["token", "role", "package", "name", "email"].forEach((k) => localStorage.removeItem(k));
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  const hasBuilder = ["builder", "pro", "starter"].includes(userPackage);
  const initials   = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const navLinks: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "websites", label: "My Websites", icon: <Globe className="w-4 h-4" />        },
    { id: "agency",   label: "Agency",      icon: <Building2 className="w-4 h-4" />    },
    { id: "billing",  label: "Billing",     icon: <CreditCard className="w-4 h-4" />   },
    { id: "profile",  label: "Profile",     icon: <User className="w-4 h-4" />         },
    { id: "support",  label: "Support",     icon: <HeadphonesIcon className="w-4 h-4" /> },
  ];

  if (loading) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: T.bg }}>
      <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: T.border, borderTopColor: T.accent }} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex overflow-hidden" style={{ background: T.bg }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col h-full" style={{ background: T.bg, borderRight: `1px solid ${T.border}` }}>

        {/* Brand */}
        <div className="h-14 flex items-center px-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: T.accent }}>
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14px] font-semibold" style={{ color: T.text }}>Client Portal</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#5f6368" }}>Navigation</p>
          {navLinks.map((link) => {
            const active = activeNav === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveNav(link.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] mb-0.5 transition-all text-left"
                style={{
                  color:      active ? T.accent : T.muted,
                  background: active ? T.accentBg : "transparent",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {link.icon}
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: plan + logout */}
        <div className="px-2 py-3" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="px-3 py-2.5 rounded-lg mb-1 flex items-center gap-2.5" style={{ background: T.hover }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0" style={{ background: T.accent, color: "#fff" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: T.text }}>{userName}</p>
              <p className="text-[11px] truncate" style={{ color: T.muted }}>{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left mt-0.5"
            style={{ color: T.muted }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c5221f"; (e.currentTarget as HTMLElement).style.background = "rgba(197,34,31,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h1 className="text-[15px] font-semibold" style={{ color: T.text }}>
              {activeNav === "websites" && "My Websites"}
              {activeNav === "agency"   && "Agency"}
              {activeNav === "billing"  && "Billing & Subscription"}
              {activeNav === "profile"  && "Profile"}
              {activeNav === "support"  && "Support"}
            </h1>
          </div>
          {activeNav === "websites" && hasBuilder && (
            <Link
              href="/builder?new=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Website
            </Link>
          )}
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── Websites ── */}
          {activeNav === "websites" && (
            <div>
              {hasBuilder ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj._id}
                      className="flex flex-col gap-4 p-5 rounded-xl"
                      style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: proj.primaryColor || "#a8c7fa" }} />
                          <div>
                            <p className="text-[14px] font-semibold" style={{ color: T.text }}>{proj.businessName || "My Website"}</p>
                            {proj.tagline && <p className="text-[11px] truncate max-w-[180px] mt-0.5" style={{ color: T.muted }}>"{proj.tagline}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wide"
                            style={proj.status === "ready"
                              ? { background: "rgba(52,211,153,0.1)", color: "#34d399" }
                              : proj.status === "generating"
                              ? { background: T.accentBg, color: T.accent }
                              : { background: T.hover, color: T.muted }}
                          >
                            {proj.status === "generating" ? "Building..." : proj.status}
                          </span>
                          <button
                            onClick={(e) => handleDeleteProject(proj._id, e)}
                            className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                            style={{ color: T.muted }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c5221f"; (e.currentTarget as HTMLElement).style.background = "rgba(197,34,31,0.06)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono px-2 py-1 rounded-md" style={{ background: T.hover, color: T.muted }}>{proj.primaryColor || "#000"}</span>
                        <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: T.hover, color: T.muted }}>{proj.pages?.length || 0} pages</span>
                        <span className="text-[11px] px-2 py-1 rounded-md uppercase" style={{ background: T.hover, color: T.muted }}>{proj.package || "Starter"}</span>
                        {proj.agencyId && (
                          <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: T.accentBg, color: T.accent }}>Agency</span>
                        )}
                      </div>

                      {/* Pages */}
                      {proj.pages?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.pages.map((page) => (
                            <Link
                              key={page.id}
                              href={`/builder?projectId=${proj._id}&pageId=${page.id}`}
                              className="text-[11px] px-2.5 py-1 rounded-md transition-all"
                              style={{ background: T.hover, color: T.muted, border: `1px solid ${T.border}` }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.borderColor = "#BDBDBD"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
                            >
                              {page.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                        <Link
                          href={`/site/${proj._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
                          style={{ background: T.hover, color: T.muted, border: `1px solid ${T.border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = T.hover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = T.hover; }}
                        >
                          <Globe className="w-3 h-3" /> View
                        </Link>
                        <Link
                          href={`/builder?projectId=${proj._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
                          style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
                        >
                          Open Builder <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Add new */}
                  <Link
                    href="/builder?new=true"
                    className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl transition-all min-h-[200px] group"
                    style={{ border: `1px dashed ${T.border}`, color: T.muted }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,68,212,0.3)"; (e.currentTarget as HTMLElement).style.color = T.accent; (e.currentTarget as HTMLElement).style.background = T.accentBg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.muted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Plus className="w-6 h-6" />
                    <div className="text-center">
                      <p className="text-[13px] font-semibold">New Website</p>
                      <p className="text-[11px] mt-1 max-w-[160px] leading-relaxed opacity-70">Create with AI or start from scratch</p>
                    </div>
                  </Link>
                </div>
              ) : (
                /* Upgrade */
                <div className="max-w-lg p-6 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.hover }}>
                      <Sparkles className="w-5 h-5" style={{ color: T.accent }} />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Unlock Website Builder</h2>
                      <p className="text-[13px]" style={{ color: T.muted }}>Upgrade to start building</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl mb-5" style={{ background: T.hover }}>
                    {[
                      ["Drag & Drop Editor", "Customize blocks freely"],
                      ["AI Generation", "Describe your brand"],
                      ["Multi-page Sites", "Full website experiences"],
                      ["Custom Domain", "Your own domain"],
                    ].map(([title, desc]) => (
                      <div key={title} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: T.accent }} />
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: T.text }}>{title}</p>
                          <p className="text-[13px]" style={{ color: T.muted }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-lead-popup"))}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
                  >
                    Request Builder Package <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {projects.length === 0 && hasBuilder && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Sparkles className="w-8 h-8 mb-4 animate-pulse" style={{ color: T.muted }} />
                  <h3 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>No websites yet</h3>
                  <p className="text-[13px] mb-6 max-w-xs leading-relaxed" style={{ color: T.muted }}>
                    Launch the AI generator to create your first site instantly.
                  </p>
                  <Link
                    href="/builder?new=true"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold"
                    style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Create First Site
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Agency (Phase 8) ── */}
          {activeNav === "agency" && <AgencyPanel />}

          {/* ── Billing ── */}
          {activeNav === "billing" && (
            <div className="max-w-md space-y-4">
              {subscription ? (
                <>
                  {/* Current plan */}
                  <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: T.muted }}>Current Plan</p>
                    <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <p className="text-[18px] font-black capitalize" style={{ color: T.text }}>{subscription.plan} Plan</p>
                        <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>
                          {subscription.cancelAtPeriodEnd ? "Cancels at period end" : "Renews automatically"}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg uppercase tracking-wide"
                        style={subscription.status === "active"
                          ? { background: "rgba(52,211,153,0.1)", color: "#34d399" }
                          : { background: "rgba(197,34,31,0.08)", color: "#c5221f" }}
                      >
                        {subscription.status}
                      </span>
                    </div>

                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: T.hover }}>
                        <Calendar className="w-3.5 h-3.5" style={{ color: T.muted }} />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.muted }}>
                            {subscription.cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                          </p>
                          <p className="text-[13px] font-medium" style={{ color: T.text }}>
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(180,83,9,0.06)", border: "1px solid rgba(180,83,9,0.15)" }}>
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#b45309" }} />
                      <p className="text-[13px]" style={{ color: "#b45309" }}>
                        Your plan is set to cancel. You can re-activate it from the billing portal before the period ends.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all"
                    style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
                  >
                    {portalLoading ? (
                      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(99,68,212,0.2)", borderTopColor: T.accent }} />
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Manage Billing & Invoices</>
                    )}
                  </button>
                </>
              ) : (
                <div className="p-6 rounded-xl text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <Sparkles className="w-8 h-8 mx-auto mb-3 animate-pulse" style={{ color: T.muted }} />
                  <p className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>No active subscription</p>
                  <p className="text-[13px] mb-5" style={{ color: T.muted }}>Upgrade to unlock the website builder and start creating.</p>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: T.accentBg, color: T.accent, border: `1px solid rgba(99,68,212,0.2)` }}
                  >
                    View Plans <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {activeNav === "profile" && (
            <div className="max-w-md space-y-3">
              <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-4 mb-5 pb-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: T.accent, color: "#fff" }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: T.text }}>{userName}</p>
                    <p className="text-[13px]" style={{ color: T.muted }}>{userEmail}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: <User className="w-3.5 h-3.5" />, label: "Full Name",    value: userName },
                    { icon: <Mail className="w-3.5 h-3.5" />, label: "Email",        value: userEmail },
                    { icon: <Package className="w-3.5 h-3.5" />, label: "Active Plan", value: userPackage || "Standard" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: T.hover }}>
                      <span style={{ color: T.muted }}>{row.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.muted }}>{row.label}</p>
                        <p className="text-[13px] font-medium truncate" style={{ color: T.text }}>{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
                style={{ color: "#c5221f", background: "rgba(197,34,31,0.05)", border: "1px solid rgba(197,34,31,0.15)" }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}

          {/* ── Support ── */}
          {activeNav === "support" && (
            <div className="max-w-md space-y-3">
              <div className="p-5 rounded-xl space-y-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accentBg }}>
                    <HeadphonesIcon className="w-4 h-4" style={{ color: T.accent }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: T.text }}>We&apos;re here to help</p>
                    <p className="text-[13px]" style={{ color: T.muted }}>Reach our team through any channel</p>
                  </div>
                </div>
                {[
                  { label: "Email Support", value: "support@lhrweb.com", href: "mailto:support@lhrweb.com", sub: "Reply within 24 hours" },
                  { label: "WhatsApp",      value: "Chat with us",        href: "#",                         sub: "Business hours"        },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between p-4 rounded-lg transition-all group"
                    style={{ background: T.hover }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EBEBEB"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = T.hover; }}
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.muted }}>{item.label}</p>
                      <p className="text-[13px] font-medium mt-0.5" style={{ color: T.text }}>{item.value}</p>
                      <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>{item.sub}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 shrink-0" style={{ color: T.muted }} />
                  </a>
                ))}
              </div>

              <div className="p-5 rounded-xl" style={{ background: T.accentBg, border: "1px solid rgba(99,68,212,0.2)" }}>
                <p className="text-[14px] font-semibold mb-1" style={{ color: T.accent }}>Need a new feature?</p>
                <p className="text-[13px] mb-4 leading-relaxed" style={{ color: T.muted }}>
                  Tell us what you need and we&apos;ll work with you to make it happen.
                </p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-lead-popup"))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
                  style={{ background: T.accent, color: "#fff" }}
                >
                  Send a Request <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
