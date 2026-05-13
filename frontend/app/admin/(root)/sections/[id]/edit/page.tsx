"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getPages, Page as PageType } from "@/services/pageService";
import {
  SECTION_TYPES_BY_KEY,
  SECTION_TYPES_GROUPED,
  SectionType,
} from "@/lib/sectionRegistry";

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

export default function SectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnTo     = searchParams.get("returnTo") || "/admin/pages";

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [allBlogs, setAllBlogs]           = useState<BlogItem[]>([]);
  const [allProjects, setAllProjects]     = useState<ProjectItem[]>([]);
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

    fetch("http://localhost:8000/api/projects")
      .then((r) => r.json())
      .then((data) => setAllProjects(Array.isArray(data) ? data : []))
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
      router.push(returnTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error && !name) return <div className="p-8 text-red-600">{error}</div>;

  return <div className="max-w-5xl">
      <div className="flex items-end justify-between mb-8">
        <div>
          <button 
            type="button" 
            onClick={() => router.push(returnTo)}
            className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors mb-4 flex items-center gap-2"
          >
            <span>←</span> Back to Overview
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit {name || "Section"}</h1>
          <p className="text-[13px] text-gray-500 mt-2">
            Fine-tune the content and configuration of this page component.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8" encType="multipart/form-data">
        {/* Step 1: Configuration */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Phase 1: Location & Blueprint</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Target Page</label>
                <select
                  className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  required
                >
                  <option value="">Select page...</option>
                  {availablePages.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Component Type</label>
                <select
                  className="w-full px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all appearance-none cursor-pointer"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  required
                >
                  <option value="">Select component type...</option>
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
          </div>

          {sectionType && (
            <div className="p-8 bg-white flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
                ✦
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900 mb-1">{sectionType.label}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{sectionType.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Auto Content Info */}
        {fields.autoContent && (
          <div className="p-8 bg-black rounded-3xl text-white shadow-lg flex items-center gap-6 overflow-hidden relative">
            <div className="relative z-10 flex-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Automated Component</p>
              <p className="text-[14px] text-gray-300 leading-relaxed">{fields.autoContent}</p>
            </div>
            <div className="text-4xl opacity-20 relative z-10">⚙</div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          </div>
        )}

        {/* Step 2: Content Details */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Phase 2: Content Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Internal Reference Name</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Home - Hero Header"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-2 ml-1">Used for organization in the admin panel.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Sequence Order</label>
                <input
                  type="number"
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{fields.title?.label || "Component Title"}</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={fields.title?.placeholder || "Headline for this section..."}
                />
                {fields.title?.hint && <p className="text-[11px] text-gray-400 mt-2 ml-1 italic">{fields.title.hint}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{fields.shortDescription?.label || "Short Summary"}</label>
                <input
                  className="w-full px-5 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder={fields.shortDescription?.placeholder || "Brief subtitle..."}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{fields.description?.label || "Detailed Description"}</label>
                <textarea
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={fields.description?.placeholder || "Main body text content..."}
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2rem] space-y-8">
                <div className="space-y-4">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{fields.image?.label || "Primary Image"}</label>
                  {currentImageUrl && (
                    <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                      <img src={currentImageUrl.startsWith("http") ? currentImageUrl : `http://localhost:8000/${currentImageUrl}`} alt="Current" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Image</span>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="text-[11px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:bg-white file:text-gray-600 hover:file:bg-gray-100 transition-all cursor-pointer" />
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">{fields.featuredImage?.label || "Secondary/Featured Image"}</label>
                  {currentFeaturedImageUrl && (
                    <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                      <img src={currentFeaturedImageUrl.startsWith("http") ? currentFeaturedImageUrl : `http://localhost:8000/${currentFeaturedImageUrl}`} alt="Current" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Featured</span>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)} className="text-[11px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-bold file:bg-white file:text-gray-600 hover:file:bg-gray-100 transition-all cursor-pointer" />
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 border border-gray-100 rounded-[2rem] space-y-4">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Call to Action Button</label>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="Label (e.g. Contact Us)"
                    value={buttonLabel}
                    onChange={(e) => setButtonLabel(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    placeholder="Target URL (e.g. /contact)"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specialized Pickers */}
          {fields.blogPicker && (
            <div className="pt-8 border-t border-gray-50">
              <label className="admin-label mb-4">Select Journal Entries</label>
              {allBlogs.length === 0 ? (
                <p className="text-[13px] text-gray-400 italic p-8 bg-gray-50 rounded-3xl text-center">No journal entries found to display.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 pr-3 scrollbar-thin scrollbar-thumb-gray-100">
                  {allBlogs.map((blog) => {
                    const selected = accordion.some((item) => item.content === blog._id);
                    return (
                      <label
                        key={blog._id}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          selected ? "bg-black border-black text-white shadow-md" : "bg-white border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <input type="checkbox" checked={selected} onChange={() => toggleBlog(blog)} className="hidden" />
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected ? "bg-white text-black" : "bg-gray-50"}`}>
                          {selected && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="text-[12px] font-bold flex-1 truncate">{blog.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {fields.projectPicker && (
            <div className="pt-8 border-t border-gray-50">
              <label className="admin-label mb-4">Select Featured Projects</label>
              {allProjects.length === 0 ? (
                <p className="text-[13px] text-gray-400 italic p-8 bg-gray-50 rounded-3xl text-center">No projects found to display.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 pr-3 scrollbar-thin scrollbar-thumb-gray-100">
                  {allProjects.map((project) => {
                    const selected = accordion.some((item) => item.content === project._id);
                    return (
                      <label
                        key={project._id}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                          selected ? "bg-black border-black text-white shadow-md" : "bg-white border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <input type="checkbox" checked={selected} onChange={() => toggleProject(project)} className="hidden" />
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected ? "bg-white text-black" : "bg-gray-50"}`}>
                          {selected && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="text-[12px] font-bold flex-1 truncate">{project.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!fields.blogPicker && !fields.projectPicker && (
            <div className="pt-8 border-t border-gray-50">
              <div className="flex items-center justify-between mb-6 px-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">{fields.accordion?.label || "Dynamic List Items"}</label>
                <button
                  type="button"
                  className="text-[11px] font-bold text-black hover:opacity-70 transition-opacity"
                  onClick={() => setAccordion((prev) => [...prev, { title: "", content: "" }])}
                >+ Add Item</button>
              </div>
              
              <div className="space-y-4">
                {accordion.map((item, idx) => (
                  <div key={idx} className="group p-6 bg-gray-50/50 border border-gray-100 rounded-3xl space-y-4 relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">{fields.accordion?.titleLabel || "Entry Title"}</label>
                        <input
                          className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                          placeholder={fields.accordion?.titlePlaceholder || "Enter title..."}
                          value={item.title}
                          onChange={(e) => handleAccordionChange(idx, "title", e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="mt-8 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => setAccordion((prev) => prev.filter((_, i) => i !== idx))}
                      >✕</button>
                    </div>

                    {fields.accordion?.subFields ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.accordion.subFields.map((sf, sfIdx) => {
                          const parts = item.content.split("|");
                          return (
                            <div key={sfIdx} className={sf.multiline ? "md:col-span-2" : ""}>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">{sf.label}</label>
                              {sf.multiline ? (
                                <textarea
                                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                  rows={3}
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
                                  className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
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
                        })}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">{fields.accordion?.contentLabel || "Entry Content"}</label>
                        <textarea
                          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                          rows={3}
                          placeholder={fields.accordion?.contentPlaceholder || "Enter content..."}
                          value={item.content}
                          onChange={(e) => handleAccordionChange(idx, "content", e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium animate-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-black text-white px-8 py-4 rounded-2xl text-[14px] font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Deploying changes..." : "Save Changes"}
          </button>
          <button 
            type="button" 
            onClick={() => router.push(returnTo)}
            className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-bold hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
}
