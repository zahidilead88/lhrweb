"use client";
import { useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  permissions: string[];
}

const ALL_PERMISSIONS = [
  { key: "pages",    label: "Pages" },
  { key: "sections", label: "Sections" },
  { key: "blog",     label: "Blog" },
  { key: "projects", label: "Projects" },
  { key: "menu",     label: "Menu" },
  { key: "services", label: "Services" },
];

const emptyForm = { name: "", email: "", password: "", role: "user" as "admin" | "user", permissions: [] as string[] };

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<User | null>(null);
  const [form, setForm]         = useState({ ...emptyForm });
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, permissions: user.permissions || [] });
    setError(null);
    setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!editing && !form.password.trim()) { setError("Password is required for new users"); return; }
    setSaving(true);
    setError(null);
    try {
      const body: any = { name: form.name, email: form.email, role: form.role, permissions: form.permissions };
      if (form.password) body.password = form.password;
      const url    = editing ? `http://localhost:8000/api/users/${editing._id}` : "http://localhost:8000/api/users";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    await fetch(`http://localhost:8000/api/users/${user._id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="admin-heading">Team</h1>
          <p className="admin-subtext">Manage user roles and granular access permissions for your team.</p>
        </div>
        <button
          onClick={openAdd}
          className="admin-button-primary"
        >
          <span className="text-lg leading-none">+</span> Add User
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">{editing ? `Edit ${editing.name}` : "New User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="admin-label">Full Name</label>
                  <input
                    className="admin-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">Email Address</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="admin-label">
                    Password {editing && <span className="font-normal lowercase">(Optional)</span>}
                  </label>
                  <input
                    type="password"
                    className="admin-input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "••••••••" : "Min 6 characters"}
                  />
                </div>
                <div>
                  <label className="admin-label">Access Role</label>
                  <select
                    className="admin-select font-bold"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "user" })}
                  >
                    <option value="user">Restricted User</option>
                    <option value="admin">Full Administrator</option>
                  </select>
                </div>
              </div>

              {/* Permissions — only shown for non-admin role */}
              {form.role === "user" && (
                <div className="space-y-4 pt-2">
                  <label className="admin-label">
                    Granular Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          form.permissions.includes(p.key) 
                            ? "bg-black border-black text-white" 
                            : "bg-white border-gray-200 group-hover:border-gray-400"
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(p.key)}
                            onChange={() => togglePermission(p.key)}
                            className="hidden"
                          />
                          {form.permissions.includes(p.key) && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="text-[13px] font-medium text-gray-600">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.role === "admin" && (
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-[2rem] text-[12px] text-blue-700 font-medium leading-relaxed">
                  Administrators have unrestricted access to all modules and system settings.
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-8">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 admin-button-primary py-4 rounded-2xl"
                >
                  {saving ? "Saving..." : editing ? "Update User" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="admin-button-secondary py-4 rounded-2xl border-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-medium text-gray-400">Fetching team members...</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="admin-table-header">
                <th className="admin-table-th">Team Member</th>
                <th className="admin-table-th">Role</th>
                <th className="admin-table-th">Permissions</th>
                <th className="admin-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-gray-900">{user.name}</span>
                      <span className="text-[12px] text-gray-400 font-mono">{user.email}</span>
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <span className={`admin-badge ${
                      user.role === "admin"
                        ? "admin-badge-dark"
                        : "admin-badge-light"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="admin-table-td">
                    {user.role === "admin" ? (
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest italic">Root Access</span>
                    ) : user.permissions?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((p) => (
                          <span key={p} className="admin-badge admin-badge-mono">
                            {ALL_PERMISSIONS.find((a) => a.key === p)?.label ?? p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">No Access</span>
                    )}
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(user)}
                        className="admin-button-secondary py-2 px-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="admin-button-danger py-2 px-4"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50 flex justify-between items-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Total {users.length} member{users.length !== 1 ? "s" : ""} active
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
