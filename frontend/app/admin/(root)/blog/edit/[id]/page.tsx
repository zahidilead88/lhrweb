"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const EditBlogPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/blogs/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setTitle(data.title);
        setContent(data.content);
      } catch (err) {
        console.error("Failed to fetch blog", err);
        alert("Could not load blog data.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:8000/api/blogs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      router.push("/admin/blog");
    } else {
      alert("Failed to update blog");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Blog</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full border px-3 py-2 rounded"
          placeholder="Content"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Blog
        </button>
      </form>
    </div>
  );
};

export default EditBlogPage;
