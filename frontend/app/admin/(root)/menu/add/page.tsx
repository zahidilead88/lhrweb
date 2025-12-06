"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMenuPage() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [sublinks, setSublinks] = useState([{ title: "", url: "" }]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("http://localhost:8000/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, sublinks }),
    });

    router.push("/admin/menu");
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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Add Menu</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Menu Title"
          className="w-full border px-3 py-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Menu URL"
          className="w-full border px-3 py-2 rounded"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <div>
          <label className="font-medium">Sublinks</label>
          <div className="space-y-2 mt-2">
            {sublinks.map((sub, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Label"
                  className="w-1/2 border px-2 py-1 rounded"
                  value={sub.title}
                  onChange={(e) =>
                    handleSubLinkChange(index, "title", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="URL"
                  className="w-1/2 border px-2 py-1 rounded"
                  value={sub.url}
                  onChange={(e) =>
                    handleSubLinkChange(index, "url", e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeSubLink(index)}
                  className="text-red-600 font-bold px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSubLink}
            className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            + Add Sub Link
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Menu
        </button>
      </form>
    </div>
  );
}
