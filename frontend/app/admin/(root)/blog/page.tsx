"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);

  const handleAddBlog = () => {
    router.push("/admin/blog/add"); // Adjust the path if it's different
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/blogs");
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this blog?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:8000/api/blogs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBlogs((prev) => prev.filter((blog: any) => blog._id !== id));
      } else {
        console.error("Failed to delete blog");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/blog/edit/${id}`);
  };

  return (
    <div>
      <button onClick={handleAddBlog}>Add Blog</button>
      {blogs.length === 0 ? (
        <p>No blogs found.</p>
      ) : (
        <ul className="space-y-4">
          {blogs.map((blog: any) => (
            <li
              key={blog._id}
              className="p-4 bg-white rounded shadow border border-gray-200"
            >
              <h2 className="text-lg font-bold">{blog.title}</h2>
              <p className="text-gray-600 line-clamp-2">{blog.content}</p>
              {blog.thumbnail && (
                <img
                  src={`http://localhost:8000/${blog.thumbnail}`}
                  alt="Thumbnail"
                  className="w-full h-40 object-cover mb-4 rounded"
                />
              )}
              <p className="text-sm text-gray-400 mb-2">
                {new Date(blog.createdAt).toLocaleString()}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(blog._id)}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(blog._id)}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Page;
