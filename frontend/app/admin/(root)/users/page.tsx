"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Globe, Trash2, ExternalLink, Plus, FileText, Pencil } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Website {
  _id:          string;
  businessName: string;
  tagline:      string;
  primaryColor: string;
  package:      string;
  status:       string;
  pages:        Array<{ id: string; name: string; slug: string }>;
  updatedAt:    string;
}

interface User {
  _id:         string;
  name:        string;
  email:       string;
  role:        "admin" | "user" | "builder";
  permissions: string[];
  package?:    "starter" | "pro";
}

const ALL_PERMISSIONS = [
  { key: "pages",    label: "Pages"    },
  { key: "sections", label: "Sections" },
  { key: "blog",     label: "Blog"     },
  { key: "projects", label: "Projects" },
  { key: "menu",     label: "Menu"     },
  { key: "services", label: "Services" },
];

type Role = "admin" | "user" | "builder";
const emptyForm = { name: "", email: "", password: "", role: "user" as Role, permissions: [] as string[], package: "" as "" | "starter" | "pro" };

const D = {
  surface: { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  input:   { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" } as React.CSSProperties,
  label:   { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", display: "block", marginBottom: 6 },
  th:      { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", padding: "10px 16px", textAlign: "left" } as React.CSSProperties,
  td:      { color: "#e8eaed", fontSize: 13, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
};

function iFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iBlur (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

function roleBadge(role: string) {
  const map: Record<string, { bg: string; color: string }> = {
    admin:   { bg: "rgba(168,199,250,0.15)", color: "#a8c7fa" },
    builder: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
    user:    { bg: "rgba(255,255,255,0.06)", color: "#9aa0a6" },
  };
  const s = map[role] ?? map.user;
  return <span style={{ ...s, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{role}</span>;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    ready:      { bg: "rgba(52,211,153,0.1)",  color: "#34d399" },
    generating: { bg: "rgba(168,199,250,0.1)", color: "#a8c7fa" },
    empty:      { bg: "rgba(255,255,255,0.06)", color: "#9aa0a6" },
  };
  const s = map[status] ?? map.empty;
  return <span style={{ ...s, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{status}</span>;
}

// ── Pages list inside an expanded website ─────────────────────────────────────
function WebsitePages({
  userId, site, token, onSiteDeleted,
}: {
  userId: string;
  site: Website;
  token: string;
  onSiteDeleted: () => void;
}) {
  const deletePage = async (pageId: string, name: string) => {
    if (!confirm(`Delete page "${name}"? This cannot be undone.`)) return;
    await fetch(`${API}/api/users/${userId}/websites/${site._id}/pages/${pageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onSiteDeleted(); // reload the sites list to reflect updated page count
  };

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.25)" }}>
      {site.pages?.length === 0 ? (
        <p className="px-8 py-3 text-[11px]" style={{ color: "#5f6368" }}>No pages yet.</p>
      ) : (
        <div className="px-8 py-3 space-y-1.5">
          {site.pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#5f6368" }} />
                <span className="text-[12px] font-medium truncate" style={{ color: "#e8eaed" }}>{page.name}</span>
                <span className="text-[11px] font-mono" style={{ color: "#5f6368" }}>/{page.slug}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* View */}
                <a
                  href={`/builder/preview?id=${site._id}&page=${page.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Preview page"
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                  style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#a8c7fa"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; }}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {/* Open in Builder */}
                <a
                  href={`/builder?projectId=${site._id}&pageId=${page.id}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Edit in Builder"
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all"
                  style={{ color: "#a8c7fa", background: "rgba(168,199,250,0.08)", border: "1px solid rgba(168,199,250,0.15)" }}
                >
                  <Pencil className="w-2.5 h-2.5" /> Builder
                </a>
                {/* Delete page */}
                <button
                  onClick={() => deletePage(page.id, page.name)}
                  title="Delete page"
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                  style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Websites panel shown when a user row is expanded ──────────────────────────
function UserWebsites({ userId, token }: { userId: string; token: string }) {
  const [sites,        setSites]        = useState<Website[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/users/${userId}/websites`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSites(Array.isArray(d) ? d : []))
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [userId]);

  const handleDeleteSite = async (siteId: string, name: string) => {
    if (!confirm(`Delete website "${name}" and all its pages? This cannot be undone.`)) return;
    await fetch(`${API}/api/users/${userId}/websites/${siteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (expandedSite === siteId) setExpandedSite(null);
    load();
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-4 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
      <span className="text-[12px]" style={{ color: "#9aa0a6" }}>Loading websites…</span>
    </div>
  );

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
      {/* Sub-header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" style={{ color: "#9aa0a6" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#9aa0a6" }}>
            {sites.length} Website{sites.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="px-6 pb-5 text-[12px]" style={{ color: "#5f6368" }}>
          No websites yet. This user hasn&apos;t created any builder sites.
        </div>
      ) : (
        <div className="px-6 pb-4 space-y-2">
          {sites.map((site) => (
            <div
              key={site._id}
              className="rounded-xl overflow-hidden"
              style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Website row — click to expand pages */}
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                {/* Clickable site info → toggles pages */}
                <button
                  onClick={() => setExpandedSite((prev) => (prev === site._id ? null : site._id))}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: site.primaryColor || "#333" }} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "#e8eaed" }}>
                      {site.businessName || "Untitled"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {statusBadge(site.status)}
                      <span className="text-[11px]" style={{ color: "#5f6368" }}>
                        {site.pages?.length || 0} page{site.pages?.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {expandedSite === site._id
                    ? <ChevronUp className="w-3.5 h-3.5 ml-1 flex-shrink-0" style={{ color: "#9aa0a6" }} />
                    : <ChevronDown className="w-3.5 h-3.5 ml-1 flex-shrink-0" style={{ color: "#9aa0a6" }} />}
                </button>

                {/* Site-level actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`/builder?projectId=${site._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                    style={{ color: "#a8c7fa", background: "rgba(168,199,250,0.08)", border: "1px solid rgba(168,199,250,0.15)" }}
                  >
                    Open Builder
                  </a>
                  <button
                    onClick={() => handleDeleteSite(site._id, site.businessName)}
                    title="Delete website"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Pages list — shown when website is expanded */}
              {expandedSite === site._id && (
                <WebsitePages
                  userId={userId}
                  site={site}
                  token={token}
                  onSiteDeleted={load}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<User | null>(null);
  const [form,     setForm]     = useState({ ...emptyForm });
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [token,    setToken]    = useState("");

  useEffect(() => { setToken(localStorage.getItem("token") || ""); }, []);

  const load = () => {
    const tok = localStorage.getItem("token") || "";
    setLoading(true);
    fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${tok}` } })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm({ ...emptyForm }); setError(null); setShowForm(true); };
  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, permissions: user.permissions || [], package: (user.package ?? "") as "" | "starter" | "pro" });
    setError(null); setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({ ...prev, permissions: prev.permissions.includes(key) ? prev.permissions.filter((p) => p !== key) : [...prev.permissions, key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!editing && !form.password.trim()) { setError("Password is required for new users"); return; }
    setSaving(true); setError(null);
    try {
      const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role, permissions: form.permissions };
      if (form.role === "builder" && form.package) body.package = form.package;
      if (form.password) body.password = form.password;
      const url    = editing ? `${API}/api/users/${editing._id}` : `${API}/api/users`;
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setShowForm(false); load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally { setSaving(false); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    await fetch(`${API}/api/users/${user._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const toggleExpand = (userId: string) => setExpanded((prev) => (prev === userId ? null : userId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Users</h1>
          <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Manage users, roles, permissions and their builder websites.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: "#a8c7fa", color: "#111111" }}>
          + Add User
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-start justify-center z-[100] overflow-y-auto py-16 px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-xl" style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}>
            <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="text-[17px] font-semibold" style={{ color: "#e8eaed" }}>{editing ? `Edit ${editing.name}` : "New User"}</h2>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={D.label}>Full Name</label>
                  <input style={D.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Smith" required onFocus={iFocus} onBlur={iBlur} />
                </div>
                <div>
                  <label style={D.label}>Email Address</label>
                  <input type="email" style={D.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required onFocus={iFocus} onBlur={iBlur} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={D.label}>Password {editing && <span className="font-normal normal-case">(optional)</span>}</label>
                  <input type="password" style={D.input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank to keep" : "Min 6 chars"} onFocus={iFocus} onBlur={iBlur} />
                </div>
                <div>
                  <label style={D.label}>Role</label>
                  <select style={{ ...D.input, cursor: "pointer" }} value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role, permissions: [], package: "" })}
                    onFocus={iFocus} onBlur={iBlur}>
                    <option value="user">Restricted User</option>
                    <option value="admin">Full Administrator</option>
                    <option value="builder">Website Builder</option>
                  </select>
                </div>
              </div>

              {form.role === "user" && (
                <div>
                  <label style={D.label}>Permissions</label>
                  <div className="grid grid-cols-2 gap-2 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex items-center gap-3 cursor-pointer select-none">
                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: form.permissions.includes(p.key) ? "#a8c7fa" : "rgba(255,255,255,0.06)", border: form.permissions.includes(p.key) ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                          <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} className="hidden" />
                          {form.permissions.includes(p.key) && <span className="text-[9px] font-bold text-black">✓</span>}
                        </div>
                        <span className="text-[13px]" style={{ color: "#e8eaed" }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.role === "builder" && (
                <div>
                  <label style={D.label}>Builder Package</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["starter", "pro"] as const).map((pkg) => (
                      <button key={pkg} type="button" onClick={() => setForm({ ...form, package: pkg })}
                        className="p-4 rounded-xl text-left transition-colors"
                        style={{ border: `1px solid ${form.package === pkg ? "rgba(168,199,250,0.4)" : "rgba(255,255,255,0.1)"}`, background: form.package === pkg ? "rgba(168,199,250,0.08)" : "transparent" }}>
                        <p className="text-[13px] font-semibold capitalize" style={{ color: form.package === pkg ? "#a8c7fa" : "#e8eaed" }}>{pkg}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#9aa0a6" }}>{pkg === "starter" ? "Up to 5 pages" : "Up to 15 pages · all blocks"}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.role === "admin" && (
                <div className="p-4 rounded-xl text-[12px]" style={{ background: "rgba(168,199,250,0.06)", border: "1px solid rgba(168,199,250,0.15)", color: "#a8c7fa" }}>
                  Administrators have unrestricted access to all modules and system settings.
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
                  <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ background: "#a8c7fa", color: "#111111" }}>
                  {saving ? "Saving…" : editing ? "Update User" : "Create User"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={D.surface} className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#a8c7fa" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[13px]" style={{ color: "#9aa0a6" }}>No users yet.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={D.th}>User</th>
                  <th style={D.th}>Role</th>
                  <th style={D.th}>Access</th>
                  <th style={{ ...D.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <>
                    {/* User row */}
                    <tr key={user._id}>
                      <td style={D.td}>
                        <p className="text-[14px] font-medium mb-0.5" style={{ color: "#a8c7fa" }}>{user.name}</p>
                        <p className="text-[12px] font-mono" style={{ color: "#9aa0a6" }}>{user.email}</p>
                      </td>
                      <td style={D.td}>{roleBadge(user.role)}</td>
                      <td style={D.td}>
                        {user.role === "admin" ? (
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>Root Access</span>
                        ) : user.role === "builder" ? (
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: user.package === "pro" ? "#fbbf24" : "#9aa0a6" }}>
                            {user.package ? `${user.package} plan` : "No package"}
                          </span>
                        ) : user.permissions?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((p) => (
                              <span key={p} className="text-[11px] px-2 py-0.5 rounded font-medium"
                                style={{ background: "rgba(255,255,255,0.06)", color: "#9aa0a6" }}>
                                {ALL_PERMISSIONS.find((a) => a.key === p)?.label ?? p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold" style={{ color: "#f28b82" }}>No Access</span>
                        )}
                      </td>
                      <td style={{ ...D.td, textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Websites toggle — only for builder users */}
                          {user.role === "builder" && (
                            <button
                              onClick={() => toggleExpand(user._id)}
                              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                color:   expanded === user._id ? "#a8c7fa" : "#9aa0a6",
                                border:  `1px solid ${expanded === user._id ? "rgba(168,199,250,0.3)" : "rgba(255,255,255,0.1)"}`,
                                background: expanded === user._id ? "rgba(168,199,250,0.08)" : "transparent",
                              }}
                            >
                              <Globe className="w-3 h-3" />
                              Websites
                              {expanded === user._id
                                ? <ChevronUp className="w-3 h-3" />
                                : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          <button onClick={() => openEdit(user)}
                            className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e8eaed"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(user)}
                            className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "#9aa0a6", border: "1px solid rgba(255,255,255,0.1)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f28b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(234,67,53,0.3)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded websites panel */}
                    {expanded === user._id && (
                      <tr key={`${user._id}-websites`}>
                        <td colSpan={4} style={{ padding: 0 }}>
                          <UserWebsites userId={user._id} token={token} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 flex items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#5f6368" }}>
                {users.length} member{users.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
