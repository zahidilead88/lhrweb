const API_URL = "http://localhost:8000/api/pages";

export interface Page {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export const getPages = async (): Promise<Page[]> => {
  const res = await fetch(API_URL);
  return res.json();
};

export const createPage = async (page: {
  name: string;
  slug: string;
  description?: string;
}) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(page),
  });
  return res.json();
};

export const deletePage = async (id: string) => {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};
