"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPages, Page as PageType } from "@/services/pageService";
import {
  SECTION_TYPES,
  SECTION_TYPES_BY_KEY,
  SECTION_TYPES_GROUPED,
  SectionType,
} from "@/lib/sectionRegistry";

interface AccordionItem { title: string; content: string }
interface BlogItem { _id: string; title: string; thumbnail?: string }

const FALLBACK_PAGES: PageType[] = [
  { _id: "home",     name: "Home",     slug: "home" },
  { _id: "services", name: "Services", slug: "services" },
  { _id: "about",    name: "About",    slug: "about" },
  { _id: "projects", name: "Projects", slug: "projects" },
  { _id: "contact",  name: "Contact",  slug: "contact" },
  { _id: "blog",     name: "Blog",     slug: "blog" },
];

export default function SectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router   = useRouter();

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [allBlogs, setAllBlogs]           = useState<BlogItem[]>([]);
  const [dbPages, setDbPages]             = useState<PageType[]>([]);
  const [name, setName]                   = useState("");
  const [selectedKey, setSelectedKey]     = useState("");
  const [selectedPage, setSelectedPage]   = useState("");
  const [title, setTitle]                 = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription]     = useState("");
  const [image, setImage]                 = useState<File | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl]             = useState("");
  const [currentFeaturedImageUrl, setCurrentFeaturedImageUrl] = useState("");
  const [accordion, setAccordion]         = useState<AccordionItem[]>([]);
  const [buttonLabel, setButtonLabel]     = useState("");
  const [buttonUrl, setButtonUrl]         = useState("");
  const [order, setOrder]                 = useState(0);

  useEffect(() => {
    getPages().then((pgs) => { if (pgs?.length) setDbPages(pgs); });
    fetch("http://localhost:8000/api/blogs")
      .then((r) => r.json())
      .then((data) => setAllBlogs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8000/api/sections/${id}`)
      .then((r) => r.json())
      .then((s: any) => {
        setName(s.name || "");
        setSelectedKey(s.key || "");
        setSelectedPage(s.page || "");
        setTitle(s.title || "");
        setShortDescription(s.shortDescription || "");
        setDescription(s.description || "");
        setAccordion(Array.isArray(s.accordion) ? s.accordion : []);
        setButtonLabel(s.button?.label || "");
        setButtonUrl(s.button?.url || "");
        setOrder(typeof s.order === "number" ? s.order : 0);
        setCurrentImageUrl(s.image || "");
        setCurrentFeaturedImageUrl(s.featuredImage || "");
        setLoading(false);
      })
      .catch(() => { setError("Failed to fetch section"); setLoading(false); });
  }, [id]);

  const availablePages     = dbPages.length > 0 ? dbPages : FALLBACK_PAGES;
  const sectionType: SectionType | undefined = SECTION_TYPES_BY_KEY[selectedKey];
  const fields             = sectionType?.fields ?? {};

  const handleAccordionChange = (idx: number, field: keyof AccordionItem, value: string) =>
    setAccordion((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const toggleBlog = (blog: BlogItem) => {
    setAccordion((prev) => {
      const exists = prev.some((item) => item.content === blog._id);
      if (exists) return prev.filter((item) => item.content !== blog._id);
      return [...prev, { title: blog.title, content: blog._id }];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) { setError("Select a page"); return; }
    if (!selectedKey)  { setError("Select a section type"); return; }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("key", selectedKey);
      fd.append("page", selectedPage);
      fd.append("title", title);
      fd.append("shortDescription", shortDescription);
      fd.append("description", description);
      if (image) fd.append("image", image);
      if (featuredImage) fd.append("featuredImage", featuredImage);
      fd.append("accordion", JSON.stringify(accordion));
      fd.append("button", JSON.stringify({ label: buttonLabel, url: buttonUrl }));
      fd.append("order", String(order));

      const res = await fetch(`http://localhost:8000/api/sections/${id}`, { method: "PUT", body: fd });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to save");
      router.push("/admin/sections");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error && !name) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Edit: {name}</h2>
        <p className="text-sm text-gray-500 mt-1">Changes are live on the frontend after saving.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6" encType="multipart/form-data">

        {/* ── Page + Type ────────────────────── */}
        <div className="p-5 bg-gray-50 rounded-xl border space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Page & component</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1.5 text-sm">Page <span className="text-red-500">*</span></label>
              <select
                className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                required
              >
                <option value="">Select page…</option>
                {availablePages.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1.5 text-sm">Section type <span className="text-red-500">*</span></label>
              <select
                className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                required
              >
                <option value="">Select component…</option>
                {Object.entries(SECTION_TYPES_GROUPED).map(([group, types]) => (
                  <optgroup key={group} label={group}>
                    {types.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          {sectionType && (
            <div className="text-sm text-gray-600 bg-white border rounded-lg px-4 py-3">
              <span className="font-semibold">{sectionType.label}: </span>
              {sectionType.description}
            </div>
          )}
        </div>

        {/* ── Auto content notice ────────────── */}
        {fields.autoContent && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="font-semibold mb-0.5">No content needed</p>
              <p>{fields.autoContent}</p>
            </div>
          </div>
        )}

        {/* ── Content fields ─────────────────── */}
        {!fields.autoContent && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block font-semibold mb-1.5 text-sm">
                  Internal name <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-400 ml-1">(admin only)</span>
                </label>
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Order</label>
                <input
                  type="number"
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </div>

            {fields.title && (
              <div>
                <label className="block font-semibold mb-1 text-sm">{fields.title.label}</label>
                {fields.title.hint && <p className="text-xs text-gray-400 mb-1.5">{fields.title.hint}</p>}
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={fields.title.placeholder}
                />
              </div>
            )}

            {fields.shortDescription && (
              <div>
                <label className="block font-semibold mb-1 text-sm">{fields.shortDescription.label}</label>
                {fields.shortDescription.hint && <p className="text-xs text-gray-400 mb-1.5">{fields.shortDescription.hint}</p>}
                <input
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder={fields.shortDescription.placeholder}
                />
              </div>
            )}

            {fields.description && (
              <div>
                <label className="block font-semibold mb-1 text-sm">{fields.description.label}</label>
                {fields.description.hint && <p className="text-xs text-gray-400 mb-1.5">{fields.description.hint}</p>}
                <textarea
                  className="border px-3 py-2 w-full rounded-lg text-sm"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={fields.description.placeholder}
                />
              </div>
            )}

            {fields.blogPicker && (
              <div>
                <label className="block font-semibold mb-1 text-sm">Select blog posts to display</label>
                <p className="text-xs text-gray-400 mb-3">
                  Tick the posts you want shown in this section.
                </p>
                {allBlogs.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No blog posts found. Add some in the Blog section first.</p>
                ) : (
                  <div className="border rounded-xl divide-y max-h-72 overflow-y-auto">
                    {allBlogs.map((blog) => {
                      const selected = accordion.some((item) => item.content === blog._id);
                      return (
                        <label
                          key={blog._id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selected ? "bg-blue-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBlog(blog)}
                            className="w-4 h-4 accent-black"
                          />
                          <span className="text-sm font-medium flex-1">{blog.title}</span>
                          {selected && (
                            <span className="text-xs text-blue-600 font-semibold">Selected</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                {accordion.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">{accordion.length} post{accordion.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>
            )}

            {(fields.image || fields.featuredImage) && (
              <div className="grid grid-cols-2 gap-4">
                {fields.image && (
                  <div>
                    <label className="block font-semibold mb-1 text-sm">{fields.image.label}</label>
                    {fields.image.hint && <p className="text-xs text-gray-400 mb-1.5">{fields.image.hint}</p>}
                    <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                    {currentImageUrl && (
                      <img src={`http://localhost:8000/${currentImageUrl}`} alt="Current" className="mt-2 h-16 rounded-lg object-cover" />
                    )}
                  </div>
                )}
                {fields.featuredImage && (
                  <div>
                    <label className="block font-semibold mb-1 text-sm">{fields.featuredImage.label}</label>
                    {fields.featuredImage.hint && <p className="text-xs text-gray-400 mb-1.5">{fields.featuredImage.hint}</p>}
                    <input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)} />
                    {currentFeaturedImageUrl && (
                      <img src={`http://localhost:8000/${currentFeaturedImageUrl}`} alt="Current featured" className="mt-2 h-16 rounded-lg object-cover" />
                    )}
                  </div>
                )}
              </div>
            )}

            {fields.accordion && (
              <div>
                <label className="block font-semibold mb-1 text-sm">{fields.accordion.label}</label>
                {fields.accordion.hint && <p className="text-xs text-gray-400 mb-3">{fields.accordion.hint}</p>}
                <div className="space-y-3 mb-3">
                  {accordion.map((item, idx) => (
                    <div key={idx} className="border rounded-xl p-4 bg-gray-50 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">{fields.accordion!.titleLabel}</label>
                          <input
                            className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                            placeholder={fields.accordion!.titlePlaceholder}
                            value={item.title}
                            onChange={(e) => handleAccordionChange(idx, "title", e.target.value)}
                            required
                          />
                        </div>
                        <button
                          type="button"
                          className="mt-6 text-red-400 hover:text-red-600 text-xl leading-none"
                          onClick={() => setAccordion((prev) => prev.filter((_, i) => i !== idx))}
                        >×</button>
                      </div>

                      {fields.accordion!.subFields ? (
                        fields.accordion!.subFields.map((sf, sfIdx) => {
                          const parts = item.content.split("|");
                          return (
                            <div key={sfIdx}>
                              <label className="block text-xs text-gray-500 mb-1">{sf.label}</label>
                              {sf.hint && <p className="text-xs text-gray-400 mb-1">{sf.hint}</p>}
                              {sf.multiline ? (
                                <textarea
                                  className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                                  rows={2}
                                  placeholder={sf.placeholder}
                                  value={parts[sfIdx] || ""}
                                  onChange={(e) => {
                                    const newParts = item.content.split("|");
                                    newParts[sfIdx] = e.target.value;
                                    handleAccordionChange(idx, "content", newParts.join("|"));
                                  }}
                                />
                              ) : (
                                <input
                                  className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                                  placeholder={sf.placeholder}
                                  value={parts[sfIdx] || ""}
                                  onChange={(e) => {
                                    const newParts = item.content.split("|");
                                    newParts[sfIdx] = e.target.value;
                                    handleAccordionChange(idx, "content", newParts.join("|"));
                                  }}
                                />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">{fields.accordion!.contentLabel}</label>
                          <input
                            className="border px-3 py-2 w-full rounded-lg bg-white text-sm"
                            placeholder={fields.accordion!.contentPlaceholder}
                            value={item.content}
                            onChange={(e) => handleAccordionChange(idx, "content", e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => setAccordion((prev) => [...prev, { title: "", content: "" }])}
                >+ Add item</button>
              </div>
            )}

            {fields.button && (
              <div>
                <label className="block font-semibold mb-1.5 text-sm">Button</label>
                <div className="flex gap-2">
                  <input
                    className="border px-3 py-2 rounded-lg flex-1 text-sm"
                    placeholder="Button label, e.g. Get Started"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                  />
                  <input
                    className="border px-3 py-2 rounded-lg flex-1 text-sm"
                    placeholder="URL, e.g. /contact"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-semibold"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <a
            href={`http://localhost:3000/${selectedPage === "home" ? "" : selectedPage}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-black underline"
          >
            Preview page ↗
          </a>
        </div>
      </form>
    </div>
  );
}
