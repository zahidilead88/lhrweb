"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — the second piece
// of real client-side interactivity on an otherwise-static published site
// (the first was Phase 3's CartWidget). Listens for `submit` on any
// `<form data-id>` anywhere in the page — those elements are injected via
// dangerouslySetInnerHTML, outside React's own tree, so this uses plain DOM
// event delegation rather than onSubmit — builds a payload from each named
// field inside it, and posts it to the public form-submit endpoint.

import { useEffect, useState } from "react";

type Status = { formId: string; kind: "success" | "error"; message: string } | null;

function collectFormData(form: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = {};
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[name]").forEach((field) => {
    const name = field.getAttribute("name");
    if (!name) return;
    if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
      if (field.checked) data[name] = field.value || "on";
      return;
    }
    data[name] = field.value;
  });
  return data;
}

export default function FormSubmitHandler({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const handler = async (e: Event) => {
      const form = e.target as HTMLElement | null;
      if (!form || form.tagName !== "FORM" || !form.hasAttribute("data-id")) return;
      e.preventDefault();
      const formEl = form as HTMLFormElement;
      const formId = formEl.getAttribute("data-id") || "";
      const pageId = document.querySelector("[data-lhrweb-page-id]")?.getAttribute("data-lhrweb-page-id") || "";
      const data = collectFormData(formEl);

      try {
        const res = await fetch(`${API}/api/forms/public/${projectId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, formId, data }),
        });
        if (res.ok) {
          formEl.reset();
          setStatus({ formId, kind: "success", message: "Thanks — your submission was received." });
        } else {
          const d = await res.json().catch(() => null);
          setStatus({ formId, kind: "error", message: d?.message || "Something went wrong. Please try again." });
        }
      } catch {
        setStatus({ formId, kind: "error", message: "Something went wrong. Please try again." });
      }
    };
    document.addEventListener("submit", handler, true);
    return () => document.removeEventListener("submit", handler, true);
  }, [projectId]);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  if (!status) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: 20, left: 20, zIndex: 10000, maxWidth: 320,
        padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
        color: "#fff", background: status.kind === "success" ? "#16a34a" : "#dc2626",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      {status.message}
    </div>
  );
}
