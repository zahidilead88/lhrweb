"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import {
  getSections,
  getAllSections,
  deleteSection,
  Section,
  addPageToSection,
} from "@/services/sectionService";
import {
  getPages,
  createPage,
  Page as PageType,
  deletePage,
} from "@/services/pageService";

// This function safely checks if a section belongs to a given page slug,
// supporting both the old 'page' (string) and new 'pages' (array) structures.
const isSectionOnPage = (section: Section, slug: string): boolean => {
  if (section.pages && Array.isArray(section.pages)) {
    return section.pages.includes(slug);
  }
  if (typeof section.page === "string") {
    return section.page === slug;
  }
  return false;
};

const AdminDashboard = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [pages, setPages] = useState<PageType[]>([]);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPageDescription, setNewPageDescription] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchSections();
    fetchPages();
    fetchAllSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const data = await getSections();
    setSections(data);
    setLoading(false);
  };

  const fetchAllSections = async () => {
    const data = await getAllSections();
    setAllSections(data);
  };

  const fetchPages = async () => {
    const data = await getPages();
    setPages(data);
  };

  const handleAddExistingSection = async (pageSlug: string) => {
    const sectionId = selectedSections[pageSlug];
    if (!sectionId) return;

    await addPageToSection(sectionId, pageSlug);
    setSelectedSections((prev) => ({ ...prev, [pageSlug]: "" }));

    // Refetch both the main sections list and the list of all sections
    // to ensure the UI, including the dropdown, updates correctly.
    fetchSections();
    fetchAllSections();
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this section?"))
      return;
    await deleteSection(id);
    fetchSections();
  };

  const handleMoveSection = async (
    page: string,
    sectionId: string,
    direction: "up" | "down"
  ) => {
    // Find all sections for this page using the safe helper function
    const pageSections = sections.filter((s) =>
      isSectionOnPage(s, page.toLowerCase())
    );
    const idx = pageSections.findIndex((s) => s._id === sectionId);
    if (idx === -1) return;
    const newOrder = [...pageSections];
    if (direction === "up" && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    } else if (direction === "down" && idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    } else {
      return;
    }
    // Save new order to backend (for now, just update all sections in order)
    setReordering(true);
    for (let i = 0; i < newOrder.length; i++) {
      await fetch(`/api/sections/${newOrder[i]._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newOrder[i], order: i }),
      });
    }
    setReordering(false);
    fetchSections();
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPageError(null);
    if (!newPageName.trim() || !newPageSlug.trim()) {
      setPageError("Name and slug are required");
      return;
    }
    const res = await createPage({
      name: newPageName,
      slug: newPageSlug,
      description: newPageDescription,
    });
    if (res && res._id) {
      setShowAddPage(false);
      setNewPageName("");
      setNewPageSlug("");
      setNewPageDescription("");
      fetchPages();
    } else {
      setPageError(res?.message || "Failed to create page");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-full mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Pages</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => setShowAddPage(true)}
        >
          + Add Page
        </button>
      </div>
      {showAddPage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add New Page</h3>
            <form onSubmit={handleAddPage} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Name *</label>
                <input
                  className="border px-3 py-2 w-full rounded"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Slug *</label>
                <input
                  className="border px-3 py-2 w-full rounded"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  required
                  placeholder="e.g. contact, team"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <input
                  className="border px-3 py-2 w-full rounded"
                  value={newPageDescription}
                  onChange={(e) => setNewPageDescription(e.target.value)}
                />
              </div>
              {pageError && <div className="text-red-600">{pageError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setShowAddPage(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ul className="divide-y divide-gray-200 bg-white rounded shadow">
        {pages.map((page) => {
          // Use the helper function to safely filter sections for this page
          const pageSections = sections.filter((s) =>
            isSectionOnPage(s, page.slug)
          );

          // Use the helper function to find sections available to be added
          const availableSections = allSections.filter(
            (s) => !isSectionOnPage(s, page.slug)
          );

          return (
            <li key={page._id} className="py-4 px-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{page.name}</span>
                <button
                  className="text-red-500 hover:text-red-700 ml-4"
                  title="Delete page"
                  onClick={async () => {
                    if (
                      window.confirm(
                        `Delete page '${page.name}'? This cannot be undone.`
                      )
                    ) {
                      await deletePage(page._id);
                      fetchPages();
                    }
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              {/* Sections for this page */}
              <ul className="mt-2">
                {pageSections.map((section, idx) => (
                  <li
                    key={section._id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        disabled={reordering || idx === 0}
                        onClick={() =>
                          handleMoveSection(page.slug, section._id, "up")
                        }
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={reordering || idx === pageSections.length - 1}
                        onClick={() =>
                          handleMoveSection(page.slug, section._id, "down")
                        }
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <span className="text-gray-700">{section.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/sections/${section._id}/edit`}
                        className="text-blue-500 hover:text-blue-700 flex items-center"
                        title={`Edit section: ${section.name}`}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteSection(section._id)}
                        className="text-red-500 hover:text-red-700 flex items-center"
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
                {/* Add Section Options */}
                <li className="flex items-center gap-2 mt-2">
                  <select
                    value={selectedSections[page.slug] || ""}
                    onChange={(e) =>
                      setSelectedSections((prev) => ({
                        ...prev,
                        [page.slug]: e.target.value,
                      }))
                    }
                    className="border rounded px-2 py-1 flex-grow"
                  >
                    <option value="">Select an existing section...</option>
                    {availableSections.map((section) => (
                      <option key={section._id} value={section._id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAddExistingSection(page.slug)}
                    disabled={!selectedSections[page.slug]}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    Add
                  </button>
                  <span className="text-gray-400">or</span>
                  <Link
                    href={`/admin/sections/add?page=${page.slug}`}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> New Section
                  </Link>
                </li>
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AdminDashboard;
