"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPages, Page as PageType } from "@/services/pageService";

interface AccordionItem {
  title: string;
  content: string;
}

const AddSectionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<PageType[]>([]);
  const prefillPage = searchParams.get("page") || "";

  useEffect(() => {
    getPages().then(setPages);
  }, []);

  // Form fields
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [page, setPage] = useState(prefillPage);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [accordion, setAccordion] = useState<AccordionItem[]>([]);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccordionChange = (
    idx: number,
    field: keyof AccordionItem,
    value: string
  ) => {
    setAccordion((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleAddAccordion = () => {
    setAccordion((prev) => [...prev, { title: "", content: "" }]);
  };

  const handleRemoveAccordion = (idx: number) => {
    setAccordion((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("key", key);
      formData.append("title", title);
      formData.append("pages", page);
      formData.append("shortDescription", shortDescription);
      formData.append("description", description);
      if (image) formData.append("image", image);
      if (featuredImage) formData.append("featuredImage", featuredImage);
      formData.append("accordion", JSON.stringify(accordion));
      formData.append(
        "button",
        JSON.stringify({ label: buttonLabel, url: buttonUrl })
      );
      const res = await fetch("http://localhost:8000/api/sections", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        console.log(data);
        throw new Error(data.message || "Failed to add section");
      }
      router.push("/admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to add section");
      } else {
        setError("Failed to add section");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Add Section</h2>
      <form
        onSubmit={handleSave}
        className="space-y-4"
        encType="multipart/form-data"
      >
        <div>
          <label className="block font-semibold mb-1">Section Name *</label>
          <input
            className="border px-3 py-2 w-full rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Section Key *</label>
          <input
            className="border px-3 py-2 w-full rounded"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            placeholder="e.g. home-banner"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="border px-3 py-2 w-full rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Page *</label>
          <select
            className="border px-3 py-2 w-full rounded"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a page
            </option>
            {pages.map((p) => (
              <option key={p._id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Short Description</label>
          <input
            className="border px-3 py-2 w-full rounded"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="border px-3 py-2 w-full rounded"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Featured Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Accordion</label>
          <ul className="space-y-2">
            {accordion.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-center">
                <input
                  className="border px-2 py-1 rounded flex-1"
                  placeholder="Accordion title"
                  value={item.title}
                  onChange={(e) =>
                    handleAccordionChange(idx, "title", e.target.value)
                  }
                  required
                />
                <input
                  className="border px-2 py-1 rounded flex-1"
                  placeholder="Accordion content"
                  value={item.content}
                  onChange={(e) =>
                    handleAccordionChange(idx, "content", e.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  className="text-red-500 px-2"
                  onClick={() => handleRemoveAccordion(idx)}
                  title="Remove"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 text-blue-600 hover:text-blue-800"
            onClick={handleAddAccordion}
          >
            + Add Accordion
          </button>
        </div>
        <div>
          <label className="block font-semibold mb-1">Button</label>
          <div className="flex gap-2">
            <input
              className="border px-2 py-1 rounded flex-1"
              placeholder="Button label"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
            />
            <input
              className="border px-2 py-1 rounded flex-1"
              placeholder="Button URL"
              value={buttonUrl}
              onChange={(e) => setButtonUrl(e.target.value)}
            />
          </div>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Add Section"}
        </button>
      </form>
    </div>
  );
};

export default AddSectionPage;
