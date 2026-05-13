"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditMenuPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sublinks, setSublinks] = useState([{ title: "", url: "" }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/menu/${id}`);
        const data = await res.json();
        console.log("Fetched data:", data); // 🔍 Important

        // Try to directly access fields
        setTitle(data.title || "");
        setUrl(data.url || "");
        console.log("data.title", data.title);
        setSublinks(
          Array.isArray(data.sublinks) && data.sublinks.length > 0
            ? data.sublinks
            : [{ label: "", url: "" }]
        );
      } catch (err) {
        console.error("Failed to fetch menu data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:8000/api/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, sublinks }), // ✅ lowercase
    });

    if (res.ok) {
      router.push("/admin/menu");
    } else {
      alert("Failed to update menu");
    }
  };

  const handleSubLinkChange = (
    index: number,
    field: "title" | "url",
    value: string
  ) => {
    const updated = [...sublinks];
    updated[index][field] = value;
    setSublinks(updated);
  };

  const addSubLink = () => {
    setSublinks([...sublinks, { title: "", url: "" }]);
  };

  const removeSubLink = (index: number) => {
    const updated = sublinks.filter((_, i) => i !== index);
    setSublinks(updated.length ? updated : [{ title: "", url: "" }]);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Navigation Link</h1>
          <p className="text-[13px] text-gray-500 mt-2">Update the properties of your menu item.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Display Title</label>
            <input
              type="text"
              placeholder="e.g. Services"
              className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Link URL</label>
            <input
              type="text"
              placeholder="e.g. /services"
              className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dropdown Sub-links</label>
              <button
                type="button"
                onClick={addSubLink}
                className="text-[11px] font-bold text-black hover:opacity-70 transition-opacity"
              >
                + Add Row
              </button>
            </div>
            
            <div className="space-y-3">
              {sublinks.map((sub, index) => (
                <div key={index} className="flex gap-3 items-center group">
                  <input
                    type="text"
                    placeholder="Label"
                    className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[13px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    value={sub.title}
                    onChange={(e) => handleSubLinkChange(index, "title", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[13px] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    value={sub.url}
                    onChange={(e) => handleSubLinkChange(index, "url", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubLink(index)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-50">
            <button
              type="submit"
              className="flex-1 bg-black text-white px-8 py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 transition-all shadow-sm"
            >
              Save Changes
            </button>
            <button 
              type="button" 
              onClick={() => router.push("/admin/menu")}
              className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-bold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
