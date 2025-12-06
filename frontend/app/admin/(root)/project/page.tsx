"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState([]);
  const router = useRouter();

  const fetchSlides = async () => {
    const res = await fetch("http://localhost:8000/api/projects");
    const data = await res.json();
    setSlides(data);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/admin/project/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this slide?"
    );
    if (!confirmDelete) return;

    const res = await fetch(`http://localhost:8000/api/projects/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSlides((prev) => prev.filter((slide: any) => slide._id !== id));
    } else {
      alert("Failed to delete slide");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Slides</h1>
        <button
          onClick={() => router.push("/admin/project/add")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Slide
        </button>
      </div>

      {slides.length === 0 ? (
        <p>No slides found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {slides.map((slide: any) => (
            <div
              key={slide._id}
              className="border rounded-lg shadow p-4 bg-white"
            >
              <img
                src={`http://localhost:8000/${slide.image}`}
                alt={slide.title}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h2 className="text-lg font-semibold mb-1">{slide.title}</h2>
              <p className="text-sm text-gray-500 mb-2">
                Button: {slide.buttonText}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {slide.shortDescription}
              </p>
              <p className="text-sm text-gray-500 mb-2">{slide.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(slide._id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(slide._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
