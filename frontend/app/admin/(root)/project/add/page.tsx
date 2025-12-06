// app/admin/slide/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddSlidePage() {
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) return alert("Please upload an image");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("buttonText", buttonText);
    formData.append("shortDescription", shortDescription);
    formData.append("description", description);
    formData.append("image", image);

    const res = await fetch("http://localhost:8000/api/projects", {
      method: "POST",
      body: formData,
    });
    console.log("res", res);

    if (res.ok) {
      router.push("/admin/project");
    } else {
      alert("Failed to upload slide");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Add Slide</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Short Description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Button Text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full"
          required
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Upload Slide
        </button>
      </form>
    </div>
  );
}
