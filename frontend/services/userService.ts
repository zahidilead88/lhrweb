const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${API}/api/users`;

export const getUsers = async () => {
  const res = await fetch(API_URL);
  return res.json();
};

export const createUser = async (user: { name: string; email: string }) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.json();
};

export const updateUser = async (
  id: string,
  user: { name: string; email: string }
) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.json();
};

export const deleteUser = async (id: string) => {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};
