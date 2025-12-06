"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [refresh, setRefresh] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);

    const fetchBlog = async () => {
      const res = await fetch(`http://localhost:8000/api/blogs/${id}`);
      const data = await res.json();
      setBlog(data);
    };
    fetchBlog();
  }, [id, refresh]);

  // Submit new comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:8000/api/blogs/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });

    if (res.ok) {
      setComment("");
      setRefresh(!refresh);
    } else {
      alert("Failed to add comment");
    }
  };

  // Submit reply (Admin only)
  const handleReplySubmit = async (commentId: string) => {
    const reply = replyText[commentId];
    if (!reply) return;

    const res = await fetch(
      `http://localhost:8000/api/blogs/${id}/comments/${commentId}/replies`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      }
    );

    if (res.ok) {
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
      setRefresh(!refresh);
    } else {
      alert("Failed to add reply");
    }
  };

  if (!blog) return <div className="p-6">Loading blog...</div>;

  return (
    <div className="w-[90%] mx-auto pt-10">
      {blog.thumbnail ? (
        <Image
          src={`http://localhost:8000/${blog.thumbnail}`}
          alt="Thumbnail"
          width={800}
          height={400}
          className="w-full h-96 object-cover mb-4 rounded-xl"
        />
      ) : (
        ""
      )}

      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
        <p className="mb-6">{blog.content}</p>

        <hr className="my-4" />

        <h2 className="text-xl font-semibold mb-2">Comments</h2>
        {blog.comments?.length > 0 ? (
          <ul className="space-y-4">
            {blog.comments.map((c: any) => (
              <li key={c._id} className="bg-gray-100 p-3 rounded">
                <p>{c.text}</p>
                {/* Replies */}
                {c.replies?.length > 0 && (
                  <ul className="ml-6 mt-2 space-y-2">
                    {c.replies.map((r: any, idx: number) => (
                      <li key={idx} className="bg-gray-200 p-2 rounded text-sm">
                        <strong>{r.user}:</strong> {r.text}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Admin Reply Box */}
                {role === "admin" && (
                  <div className="mt-2 ml-6">
                    <textarea
                      value={replyText[c._id] || ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [c._id]: e.target.value,
                        }))
                      }
                      placeholder="Admin reply..."
                      rows={2}
                      className="w-full border px-2 py-1 rounded text-sm"
                    />
                    <button
                      onClick={() => handleReplySubmit(c._id)}
                      className="mt-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No comments yet.</p>
        )}

        {/* Add Comment Box */}
        <form onSubmit={handleCommentSubmit} className="mt-6 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
};

export default BlogDetails;
