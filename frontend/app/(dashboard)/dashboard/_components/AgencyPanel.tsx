"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
// dashboard: create an agency, invite team/client accounts, remove members,
// and edit white-label branding. Lives at the dashboard level (not inside
// /builder) since an agency spans multiple projects, not one.

import { useEffect, useState } from "react";
import { Building2, Plus, Trash2, Users, UserCog, Palette } from "lucide-react";

interface Member { _id: string; name: string; email: string; agencyRole: "owner" | "team" | "client" }
interface AgencyInfo {
  agency: { _id: string; name: string; whiteLabel: { logoUrl: string; primaryColor: string; supportEmail: string } };
  role: "owner" | "team" | "client";
  team: Member[];
  clients: Member[];
}

const T = {
  surface: "#FFFFFF", border: "#E8EAED", text: "#202124", muted: "#5F6368",
  accent: "#6344d4", accentBg: "rgba(99,68,212,0.08)", hover: "#F1F3F4",
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function AgencyPanel() {
  const [info, setInfo] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"team" | "client">("team");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/agency`, { headers: authHeaders() });
      setInfo(res.ok ? await res.json() : null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const createAgency = async () => {
    if (!newName.trim()) return;
    setError("");
    const res = await fetch(`${API}/api/agency`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: newName.trim() }) });
    if (res.ok) { setNewName(""); setCreating(false); load(); } else { const d = await res.json(); setError(d.message); }
  };

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setError("");
    const res = await fetch(`${API}/api/agency/invite`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) });
    if (res.ok) { setInviteEmail(""); load(); } else { const d = await res.json(); setError(d.message); }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Remove this member from the agency?")) return;
    await fetch(`${API}/api/agency/members/${userId}`, { method: "DELETE", headers: authHeaders() });
    load();
  };

  const updateWhiteLabel = async (field: "logoUrl" | "primaryColor" | "supportEmail", value: string) => {
    if (!info) return;
    const next = { ...info.agency.whiteLabel, [field]: value };
    setInfo({ ...info, agency: { ...info.agency, whiteLabel: next } });
    await fetch(`${API}/api/agency/white-label`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(next) });
  };

  if (loading) return <div className="py-16 text-center text-[13px]" style={{ color: T.muted }}>Loading…</div>;

  if (!info) {
    return (
      <div className="max-w-md p-6 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.hover }}>
            <Building2 className="w-5 h-5" style={{ color: T.accent }} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Start an agency</h2>
            <p className="text-[13px]" style={{ color: T.muted }}>Manage multiple client sites under one team</p>
          </div>
        </div>
        {creating ? (
          <div className="flex gap-2">
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Agency name"
              onKeyDown={(e) => e.key === "Enter" && createAgency()}
              className="flex-1 px-3 py-2 text-[13px] rounded-lg" style={{ border: `1px solid ${T.border}` }} />
            <button onClick={createAgency} className="px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ background: T.accentBg, color: T.accent }}>Create</button>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold"
            style={{ background: T.accentBg, color: T.accent, border: "1px solid rgba(99,68,212,0.2)" }}>
            <Plus className="w-3.5 h-3.5" /> Create Agency
          </button>
        )}
        {error && <p className="text-[12px] mt-3" style={{ color: "#c5221f" }}>{error}</p>}
      </div>
    );
  }

  const isOwner = info.role === "owner";

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>{info.agency.name}</h2>
        <p className="text-[12px]" style={{ color: T.muted }}>Your role: {info.role}</p>
      </div>

      {isOwner && (
        <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" style={{ color: T.muted }} />
            <h3 className="text-[13px] font-semibold" style={{ color: T.text }}>White-label branding</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>Logo URL</label>
              <input defaultValue={info.agency.whiteLabel.logoUrl} onBlur={(e) => updateWhiteLabel("logoUrl", e.target.value)}
                className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg" style={{ border: `1px solid ${T.border}` }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>Support email</label>
              <input defaultValue={info.agency.whiteLabel.supportEmail} onBlur={(e) => updateWhiteLabel("supportEmail", e.target.value)}
                className="w-full mt-1 px-3 py-2 text-[12px] rounded-lg" style={{ border: `1px solid ${T.border}` }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.muted }}>Primary color</label>
              <input type="color" defaultValue={info.agency.whiteLabel.primaryColor} onChange={(e) => updateWhiteLabel("primaryColor", e.target.value)}
                className="w-full mt-1 h-9 rounded-lg" style={{ border: `1px solid ${T.border}` }} />
            </div>
          </div>
        </div>
      )}

      <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <UserCog className="w-4 h-4" style={{ color: T.muted }} />
          <h3 className="text-[13px] font-semibold" style={{ color: T.text }}>Team ({info.team.length})</h3>
        </div>
        <div className="space-y-1.5">
          {info.team.map((m) => (
            <div key={m._id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: T.hover }}>
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: T.text }}>{m.name} {m.agencyRole === "owner" && <span className="text-[10px] font-normal" style={{ color: T.muted }}>(owner)</span>}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>{m.email}</p>
              </div>
              {isOwner && m.agencyRole !== "owner" && (
                <button onClick={() => removeMember(m._id)} style={{ color: T.muted }}><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: T.muted }} />
          <h3 className="text-[13px] font-semibold" style={{ color: T.text }}>Clients ({info.clients.length})</h3>
        </div>
        <div className="space-y-1.5 mb-3">
          {info.clients.map((m) => (
            <div key={m._id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: T.hover }}>
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: T.text }}>{m.name}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>{m.email}</p>
              </div>
              {isOwner && <button onClick={() => removeMember(m._id)} style={{ color: T.muted }}><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          ))}
          {info.clients.length === 0 && <p className="text-[12px]" style={{ color: T.muted }}>No clients yet.</p>}
        </div>
      </div>

      {isOwner && (
        <div className="p-5 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h3 className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Invite a member</h3>
          <p className="text-[11.5px] mb-3" style={{ color: T.muted }}>They need an existing LHRWEB account — this attaches it to your agency, it doesn't send a signup email.</p>
          <div className="flex gap-2">
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com"
              className="flex-1 px-3 py-2 text-[12.5px] rounded-lg" style={{ border: `1px solid ${T.border}` }} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "team" | "client")}
              className="px-3 py-2 text-[12.5px] rounded-lg" style={{ border: `1px solid ${T.border}` }}>
              <option value="team">Team</option>
              <option value="client">Client</option>
            </select>
            <button onClick={invite} className="px-4 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: T.accentBg, color: T.accent }}>Invite</button>
          </div>
          {error && <p className="text-[12px] mt-2" style={{ color: "#c5221f" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
