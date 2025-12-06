"use client";

import { useState } from "react";

export default function AddBlog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [fullImage, setFullImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    if (fullImage) {
      formData.append("fullImage", fullImage);
    }

    const res = await fetch("http://localhost:8000/api/blogs", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    console.log("result", result);

    if (!res.ok) {
      console.error("Upload error:", result);
      alert(result.message || "Failed to add blog");
    } else {
      alert("Blog added!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <input
        type="text"
        placeholder="Title"
        className="border px-3 py-2 w-full"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Content"
        className="border px-3 py-2 w-full"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setThumbnail(e.target.files[0]);
          } else {
            setThumbnail(null);
          }
        }}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setFullImage(e.target.files[0]);
          } else {
            setFullImage(null);
          }
        }}
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Blog
      </button>
    </form>
  );
}
