"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPages, Page as PageType } from "@/services/pageService";
import { SECTION_TYPES_BY_KEY, SECTION_TYPES_GROUPED, SectionType } from "@/lib/sectionRegistry";

interface AccordionItem { title: string; content: string }
interface BlogItem { _id: string; title: string; thumbnail?: string }
interface ProjectItem { _id: string; title: string; image?: string }

const FALLBACK_PAGES: PageType[] = [
  { _id: "home",     name: "Home",     slug: "home" },
  { _id: "services", name: "Services", slug: "services" },
  { _id: "about",    name: "About",    slug: "about" },
  { _id: "projects", name: "Projects", slug: "projects" },
  { _id: "contact",  name: "Contact",  slug: "contact" },
  { _id: "blog",     name: "Blog",     slug: "blog" },
];

const INPUT:   React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none" };
const LABEL:   React.CSSProperties = { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
const SURFACE: React.CSSProperties = { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
const SELECT:  React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaed", borderRadius: 10, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none", appearance: "none" as const };
function iF(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { e.currentTarget.style.borderColor = "rgba(168,199,250,0.5)"; }
function iB(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }

export default function AddSectionPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [dbPages, setDbPages]               = useState<PageType[]>([]);
  const [selectedPage, setSelectedPage]     = useState(searchParams.get("page") || "home");
  const [selectedKey, setSelectedKey]       = useState("");
  const [name, setName]                     = useState("");
  const [title, setTitle]                   = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription]       = useState("");
  const [image, setImage]                   = useState<File | null>(null);
  const [featuredImage, setFeaturedImage]   = useState<File | null>(null);
  const [accordion, setAccordion]           = useState<AccordionItem[]>([]);
  const [buttonLabel, setButtonLabel]       = useState("");
  const [buttonUrl, setButtonUrl]           = useState("");
  const [order, setOrder]                   = useState(0);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [allBlogs, setAllBlogs]             = useState<BlogItem[]>([]);
  const [allProjects, setAllProjects]       = useState<ProjectItem[]>([]);

  useEffect(() => {
    getPages().then((pgs) => { if (pgs?.length) setDbPages(pgs); });
    fetch(`${API}/api/blogs`).then((r) => r.json()).then((d) => setAllBlogs(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${API}/api/projects`).then((r) => r.json()).then((d) => setAllProjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const availablePages   = dbPages.length > 0 ? dbPages : FALLBACK_PAGES;
  const sectionType: SectionType | undefined = SECTION_TYPES_BY_KEY[selectedKey];
  const fields           = sectionType?.fields ?? {};

  const handleKeyChange = (key: string) => {
    setSelectedKey(key);
    const type = SECTION_TYPES_BY_KEY[key];
    const page = availablePages.find((p) => p.slug === selectedPage);
    if (type && page) setName(`${page.name} – ${type.label}`);
    else if (type) setName(type.label);
  };

  const handlePageChange = (slug: string) => {
    setSelectedPage(slug);
    if (selectedKey) {
      const type = SECTION_TYPES_BY_KEY[selectedKey];
      const page = availablePages.find((p) => p.slug === slug);
      if (type && page) setName(`${page.name} – ${type.label}`);
    }
  };

  const handleAccordionChange = (idx: number, field: keyof AccordionItem, value: string) =>
    setAccordion((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const toggleBlog = (blog: BlogItem) => {
    setAccordion((prev) => {
      const exists = prev.some((item) => item.content === blog._id);
      if (exists) return prev.filter((item) => item.content !== blog._id);
      return [...prev, { title: blog.title, content: blog._id }];
    });
  };

  const toggleProject = (project: ProjectItem) => {
    setAccordion((prev) => {
      const exists = prev.some((item) => item.content === project._id);
      if (exists) return prev.filter((item) => item.content !== project._id);
      return [...prev, { title: project.title, content: project._id }];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) { setError("Select a page"); return; }
    if (!selectedKey)  { setError("Select a section type"); return; }
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("name", name); fd.append("key", selectedKey); fd.append("page", selectedPage);
      fd.append("title", title); fd.append("shortDescription", shortDescription); fd.append("description", description);
      if (image) fd.append("image", image);
      if (featuredImage) fd.append("featuredImage", featuredImage);
      fd.append("accordion", JSON.stringify(accordion));
      fd.append("button", JSON.stringify({ label: buttonLabel, url: buttonUrl }));
      fd.append("order", String(order));
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API}/api/sections`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to add");
      router.push("/admin/sections");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add section");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Add Content Section</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Compose your page layout by selecting and configuring predefined content blocks.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6" encType="multipart/form-data">
        {/* Location & type */}
        <div style={SURFACE} className="p-6 space-y-5">
          <p style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Location & Component</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={LABEL}>Target Page</label>
              <select style={SELECT} value={selectedPage} onChange={(e) => handlePageChange(e.target.value)} required onFocus={iF} onBlur={iB}>
                <option value="">Select page...</option>
                {availablePages.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Component Type</label>
              <select style={SELECT} value={selectedKey} onChange={(e) => handleKeyChange(e.target.value)} required onFocus={iF} onBlur={iB}>
                <option value="">Select component type...</option>
                {Object.entries(SECTION_TYPES_GROUPED).map(([group, types]) => (
                  <optgroup key={group} label={group}>
                    {types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          {sectionType && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(168,199,250,0.05)", border: "1px solid rgba(168,199,250,0.1)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: "rgba(168,199,250,0.15)", color: "#a8c7fa" }}>✦</div>
              <div>
                <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#e8eaed" }}>{sectionType.label}</p>
                <p className="text-[12px]" style={{ color: "#9aa0a6" }}>{sectionType.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Auto content notice */}
        {fields.autoContent && (
          <div className="p-5 rounded-xl flex items-start gap-4" style={{ background: "rgba(168,199,250,0.08)", border: "1px solid rgba(168,199,250,0.2)" }}>
            <span className="text-xl opacity-60">⚙</span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a8c7fa" }}>Automated Component</p>
              <p className="text-[13px]" style={{ color: "#9aa0a6" }}>{fields.autoContent}</p>
            </div>
          </div>
        )}

        {/* Content config */}
        {selectedKey && !fields.autoContent && (
          <div style={SURFACE} className="p-6 space-y-6">
            <p style={{ color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Content Configuration</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label style={LABEL}>Internal Reference Name</label>
                <input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home - Hero Header" required onFocus={iF} onBlur={iB} />
                <p className="text-[11px] mt-1.5" style={{ color: "#5f6368" }}>Used for organization in the admin panel.</p>
              </div>
              <div>
                <label style={LABEL}>Sequence Order</label>
                <input type="number" style={{ ...INPUT, fontFamily: "monospace" }} value={order} onChange={(e) => setOrder(Number(e.target.value))} onFocus={iF} onBlur={iB} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="space-y-4">
                {fields.title && (
                  <div>
                    <label style={LABEL}>{fields.title.label}</label>
                    <input style={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={fields.title.placeholder} onFocus={iF} onBlur={iB} />
                    {fields.title.hint && <p className="text-[11px] mt-1.5 italic" style={{ color: "#5f6368" }}>{fields.title.hint}</p>}
                  </div>
                )}
                {fields.shortDescription && (
                  <div>
                    <label style={LABEL}>{fields.shortDescription.label}</label>
                    <input style={INPUT} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder={fields.shortDescription.placeholder} onFocus={iF} onBlur={iB} />
                  </div>
                )}
                {fields.description && (
                  <div>
                    <label style={LABEL}>{fields.description.label}</label>
                    <textarea style={{ ...INPUT, resize: "vertical" }} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={fields.description.placeholder} onFocus={iF} onBlur={iB} />
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {(fields.image || fields.featuredImage) && (
                  <div className="p-4 rounded-xl space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {fields.image && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>{fields.image.label}</p>
                        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="text-[11px] w-full cursor-pointer" style={{ color: "#9aa0a6" }} />
                      </div>
                    )}
                    {fields.featuredImage && (
                      <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9aa0a6" }}>{fields.featuredImage.label}</p>
                        <input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)} className="text-[11px] w-full cursor-pointer" style={{ color: "#9aa0a6" }} />
                      </div>
                    )}
                  </div>
                )}

                {fields.button && (
                  <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9aa0a6" }}>Call to Action Button</p>
                    <input style={INPUT} placeholder="Label (e.g. Contact Us)" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} onFocus={iF} onBlur={iB} />
                    <input style={{ ...INPUT, fontFamily: "monospace" }} placeholder="Target URL (e.g. /contact)" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} onFocus={iF} onBlur={iB} />
                  </div>
                )}
              </div>
            </div>

            {/* Blog picker */}
            {fields.blogPicker && (
              <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <label style={LABEL}>Select Journal Entries</label>
                {allBlogs.length === 0 ? (
                  <p className="text-[13px] text-center py-8 rounded-xl" style={{ color: "#5f6368", background: "rgba(255,255,255,0.03)" }}>No journal entries found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto">
                    {allBlogs.map((blog) => {
                      const selected = accordion.some((item) => item.content === blog._id);
                      return (
                        <label key={blog._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                          style={{ background: selected ? "rgba(168,199,250,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${selected ? "rgba(168,199,250,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                          <input type="checkbox" checked={selected} onChange={() => toggleBlog(blog)} className="hidden" />
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: selected ? "#a8c7fa" : "rgba(255,255,255,0.08)", border: `1px solid ${selected ? "#a8c7fa" : "rgba(255,255,255,0.1)"}` }}>
                            {selected && <span className="text-[9px] font-bold" style={{ color: "#111" }}>✓</span>}
                          </div>
                          <span className="text-[12px] truncate" style={{ color: selected ? "#a8c7fa" : "#9aa0a6" }}>{blog.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Project picker */}
            {fields.projectPicker && (
              <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <label style={LABEL}>Select Featured Projects</label>
                {allProjects.length === 0 ? (
                  <p className="text-[13px] text-center py-8 rounded-xl" style={{ color: "#5f6368", background: "rgba(255,255,255,0.03)" }}>No projects found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto">
                    {allProjects.map((project) => {
                      const selected = accordion.some((item) => item.content === project._id);
                      return (
                        <label key={project._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                          style={{ background: selected ? "rgba(168,199,250,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${selected ? "rgba(168,199,250,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                          <input type="checkbox" checked={selected} onChange={() => toggleProject(project)} className="hidden" />
                          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: selected ? "#a8c7fa" : "rgba(255,255,255,0.08)", border: `1px solid ${selected ? "#a8c7fa" : "rgba(255,255,255,0.1)"}` }}>
                            {selected && <span className="text-[9px] font-bold" style={{ color: "#111" }}>✓</span>}
                          </div>
                          <span className="text-[12px] truncate" style={{ color: selected ? "#a8c7fa" : "#9aa0a6" }}>{project.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Accordion items */}
            {fields.accordion && !fields.blogPicker && !fields.projectPicker && (
              <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <label style={{ ...LABEL, marginBottom: 0 }}>{fields.accordion.label}</label>
                  <button type="button" className="text-[12px] font-semibold" style={{ color: "#a8c7fa" }}
                    onClick={() => setAccordion((prev) => [...prev, { title: "", content: "" }])}>+ Add Item</button>
                </div>
                <div className="space-y-3">
                  {accordion.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label style={{ ...LABEL, fontSize: 10 }}>{fields.accordion!.titleLabel}</label>
                          <input style={INPUT} placeholder={fields.accordion!.titlePlaceholder} value={item.title}
                            onChange={(e) => handleAccordionChange(idx, "title", e.target.value)} required onFocus={iF} onBlur={iB} />
                        </div>
                        <button type="button" onClick={() => setAccordion((prev) => prev.filter((_, i) => i !== idx))}
                          className="mt-6 text-[16px] w-8 h-10 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f28b82")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>×</button>
                      </div>
                      {fields.accordion!.subFields ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {fields.accordion!.subFields.map((sf, sfIdx) => {
                            const parts = item.content.split("|");
                            return (
                              <div key={sfIdx} className={sf.multiline ? "md:col-span-2" : ""}>
                                <label style={{ ...LABEL, fontSize: 10 }}>{sf.label}</label>
                                {sf.multiline ? (
                                  <textarea style={{ ...INPUT, resize: "vertical" }} rows={3} placeholder={sf.placeholder}
                                    value={parts[sfIdx] || ""}
                                    onChange={(e) => { const p = item.content.split("|"); p[sfIdx] = e.target.value; handleAccordionChange(idx, "content", p.join("|")); }}
                                    onFocus={iF} onBlur={iB} />
                                ) : (
                                  <input style={INPUT} placeholder={sf.placeholder} value={parts[sfIdx] || ""}
                                    onChange={(e) => { const p = item.content.split("|"); p[sfIdx] = e.target.value; handleAccordionChange(idx, "content", p.join("|")); }}
                                    onFocus={iF} onBlur={iB} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <label style={{ ...LABEL, fontSize: 10 }}>{fields.accordion!.contentLabel}</label>
                          <textarea style={{ ...INPUT, resize: "vertical" }} rows={3} placeholder={fields.accordion!.contentPlaceholder}
                            value={item.content} onChange={(e) => handleAccordionChange(idx, "content", e.target.value)} required onFocus={iF} onBlur={iB} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl text-[12px] flex items-center gap-2" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.2)", color: "#f28b82" }}>
            <span className="w-4 h-4 flex items-center justify-center rounded-full text-[10px] flex-shrink-0" style={{ background: "rgba(234,67,53,0.2)" }}>!</span>{error}
          </div>
        )}

        <div className="flex gap-3 pb-10">
          <button type="submit" disabled={saving || !selectedKey}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40"
            style={{ background: "#a8c7fa", color: "#111111" }}>
            {saving ? "Deploying…" : "Deploy Section"}
          </button>
          <button type="button" onClick={() => router.push("/admin/sections")}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9aa0a6" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
