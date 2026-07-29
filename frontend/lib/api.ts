if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL is not set — refusing to run in production.");
}
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let onAuthFail: (() => void) | null = null;
export function setOnAuthFail(cb: () => void) {
  onAuthFail = cb;
}

export function apiUrl(path: string): string {
  return `${API}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API ${status}: ${body.slice(0, 200)}`);
    this.status = status;
    this.body = body;
    this.name = "ApiError";
    try {
      const parsed = JSON.parse(body);
      this.retryAfter = parsed.retryAfter;
    } catch {}
  }
}

export async function apiFetch(
  path: string,
  options?: RequestInit & { auth?: boolean; timeout?: number }
): Promise<Response> {
  const { auth = false, timeout = 15000, ...fetchOpts } = options ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      ...(fetchOpts.headers as Record<string, string>),
    };
    if (auth) {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(apiUrl(path), {
      ...fetchOpts,
      headers,
      signal: controller.signal,
    });

    if (res.status === 401 && auth && onAuthFail) {
      onAuthFail();
    }

    if (!res.ok) {
      const body = await res.text();
      const err = new ApiError(res.status, body);
      throw err;
    }

    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetchJson<T = unknown>(
  path: string,
  options?: RequestInit & { auth?: boolean; timeout?: number }
): Promise<T> {
  const res = await apiFetch(path, options);
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
