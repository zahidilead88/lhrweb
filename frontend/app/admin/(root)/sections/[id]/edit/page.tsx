"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPages, Page as PageType } from "@/services/pageService";
// Removed unused Section import

// Remove static PAGES, use dynamic pages from backend

interface AccordionItem {
  title: string;
  content: string;
}

const SectionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [section, setSection] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [title, setTitle] = useState(""); // Optional, for legacy/compat
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState<PageType[]>([]);
  const [page, setPage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [accordion, setAccordion] = useState<AccordionItem[]>([]);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/sections/${id}`)
      .then((res) => res.json())
      .then((section: Record<string, unknown>) => {
        setSection(section);
        setName(typeof section.name === "string" ? section.name : "");
        setKey(typeof section.key === "string" ? section.key : "");
        setTitle(typeof section.title === "string" ? section.title : "");
        setShortDescription(
          typeof section.shortDescription === "string"
            ? section.shortDescription
            : ""
        );
        setDescription(
          typeof section.description === "string" ? section.description : ""
        );
        setPage(typeof section.page === "string" ? section.page : "");
        setAccordion(
          Array.isArray(section.accordion)
            ? (section.accordion as AccordionItem[])
            : []
        );
        const button =
          section.button && typeof section.button === "object"
            ? (section.button as { label?: string; url?: string })
            : {};
        setButtonLabel(typeof button.label === "string" ? button.label : "");
        setButtonUrl(typeof button.url === "string" ? button.url : "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch section");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    getPages().then(setPages);
  }, []);

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
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("key", key);
      formData.append("title", title); // Optional
      formData.append("shortDescription", shortDescription);
      formData.append("description", description);
      formData.append("pages", page);
      if (image) formData.append("image", image);
      if (featuredImage) formData.append("featuredImage", featuredImage);
      formData.append("accordion", JSON.stringify(accordion));
      formData.append(
        "button",
        JSON.stringify({ label: buttonLabel, url: buttonUrl })
      );
      await fetch(`http://localhost:8000/api/sections/${id}`, {
        method: "PUT",
        body: formData,
      });
      router.push("/admin");
    } catch {
      setError("Failed to save section. Ensure all fields are valid.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!section) return <div className="p-8">Section not found</div>;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">
        Edit Section: {typeof section?.name === "string" ? section.name : ""}
      </h2>
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
        {/* Optionally keep the title field for legacy/compatibility */}

        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="border px-3 py-2 w-full rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
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
          <label className="block font-semibold mb-1">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {section && typeof section.image === "string" && section.image && (
            <div className="mt-2">
              <img
                src={`http://localhost:8000/${section.image as string}`}
                alt="Current"
                className="h-16"
              />
              <span className="text-xs text-gray-500">Current image</span>
            </div>
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1">Featured Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
          />
          {section &&
            typeof section.featuredImage === "string" &&
            section.featuredImage && (
              <div className="mt-2">
                <img
                  src={`http://localhost:8000/${
                    section.featuredImage as string
                  }`}
                  alt="Current"
                  className="h-16"
                />
                <span className="text-xs text-gray-500">
                  Current featured image
                </span>
              </div>
            )}
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
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default SectionEditPage;
