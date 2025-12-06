const API_URL = "http://localhost:8000/api/sections";

export interface Section {
  _id: string;
  name: string;
  key: string;
  pages?: string[]; // The new array of pages (optional)
  page?: string; // The old single page field (optional)
  title?: string;
  shortDescription?: string;
  description?: string;
  image?: string;
  featuredImage?: string;
  accordion?: Array<{ title: string; content: string }>;
  button?: { label?: string; url?: string };
}

export const getSections = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const getSectionsByPage = async (page: string) => {
  const res = await fetch(`${API_URL}?page=${encodeURIComponent(page)}`);
  return res.json();
};

export const getAllSections = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const createSection = async (formData: FormData) => {
  const res = await fetch(API_URL, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const updateSection = async (id: string, formData: FormData) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
  return res.json();
};

export const deleteSection = async (id: string) => {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};

// New methods for managing page assignments
export const addPageToSection = async (sectionId: string, page: string) => {
  const res = await fetch(`${API_URL}/${sectionId}/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page }),
  });
  return res.json();
};

export const removePageFromSection = async (
  sectionId: string,
  page: string
) => {
  const res = await fetch(`${API_URL}/${sectionId}/pages/${page}`, {
    method: "DELETE",
  });
  return res.json();
};
