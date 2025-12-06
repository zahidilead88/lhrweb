"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditSlidePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [title, setTitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState("");

  // Fetch existing slide data
  useEffect(() => {
    const fetchSlide = async () => {
      const res = await fetch(`http://localhost:8000/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title);
        setButtonText(data.buttonText);
        setCurrentImage(data.image); // image path e.g., /uploads/...
      } else {
        alert("Failed to load slide data");
        router.push("/admin/project");
      }
    };

    if (id) fetchSlide();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("buttonText", buttonText);
    if (image) formData.append("image", image); // Only add if updated

    const res = await fetch(`http://localhost:8000/api/projects/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (res.ok) {
      router.push("/admin/project");
    } else {
      alert("Failed to update slide");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Edit Slide</h1>

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
          placeholder="Button Text"
          value={buttonText}
          onChange={(e) => setButtonText(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />

        {currentImage && (
          <div>
            <p className="text-sm mb-1">Current Image:</p>
            <img
              src={`http://localhost:8000${currentImage}`}
              alt="Current Slide"
              className="h-40 w-full object-cover rounded"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-full"
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Slide
        </button>
      </form>
    </div>
  );
}
