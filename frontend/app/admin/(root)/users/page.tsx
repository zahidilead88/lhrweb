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
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Admins have full access. Assign specific permissions to regular users.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          + Add User
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-5">{editing ? `Edit: ${editing.name}` : "New User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    className="border px-3 py-2 w-full rounded-lg text-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    className="border px-3 py-2 w-full rounded-lg text-sm"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Password {editing && <span className="font-normal text-gray-400">(leave blank to keep)</span>}
                    {!editing && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type="password"
                    className="border px-3 py-2 w-full rounded-lg text-sm"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "••••••••" : "Min 6 characters"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Role</label>
                  <select
                    className="border px-3 py-2 w-full rounded-lg text-sm bg-white"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "user" })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin (full access)</option>
                  </select>
                </div>
              </div>

              {/* Permissions — only shown for non-admin role */}
              {form.role === "user" && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Access permissions
                    <span className="font-normal text-gray-400 ml-1">— which areas can this user manage?</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 border rounded-xl p-4 bg-gray-50">
                    {ALL_PERMISSIONS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="w-4 h-4 accent-black"
                        />
                        <span className="text-sm">{p.label}</span>
                      </label>
                    ))}
                  </div>
                  {form.permissions.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No permissions selected — this user can only log in but not edit anything.</p>
                  )}
                </div>
              )}

              {form.role === "admin" && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <span>ℹ️</span>
                  <span>Admins have full access to everything — no permission restrictions apply.</span>
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 rounded-lg text-sm border hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 mt-10 text-center">Loading…</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Permissions</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="text-xs text-gray-400 italic">All access</span>
                    ) : user.permissions?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((p) => (
                          <span key={p} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            {ALL_PERMISSIONS.find((a) => a.key === p)?.label ?? p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600">No permissions</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
