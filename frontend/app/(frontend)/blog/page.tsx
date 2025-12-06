"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Blog {
  _id: string;
  title: string;
  content: string;
  thumbnail?: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/blogs")
      .then((res) => res.json())
      .then((data: Blog[]) => setBlogs(data));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      {blogs.map((blog) => (
        <Link key={blog._id} href={`/blog/${blog._id}`}>
          <div key={blog._id} className="mb-20 border-b pb-4">
            <h2 className="text-xl font-semibold">{blog.title}</h2>
            <p className="text-gray-700 mt-2">{blog.content}</p>
            {blog.thumbnail && (
              <Image
                src={`http://localhost:8000/${blog.thumbnail}`}
                alt="Thumbnail"
                width={800}
                height={160}
                className="w-full h-40 object-cover mb-4 rounded"
              />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
