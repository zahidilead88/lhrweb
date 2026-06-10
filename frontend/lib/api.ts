export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(apiUrl(path), options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Returns a full URL for a stored image/file path (handles both absolute and relative paths)
export function imgUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API}/${path.replace(/^\//, "")}`;
}

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(apiUrl("/api/admin/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await fetch(apiUrl("/api/admin/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
};
