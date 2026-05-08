"use client";
import { useEffect, useState } from "react";
import SectionRenderer from "./SectionRenderer";

interface PageSectionsProps {
  page: string;
}

export default function PageSections({ page }: PageSectionsProps) {
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/sections?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSections(data);
      })
      .catch(() => {});
  }, [page]);

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section._id} section={section} />
      ))}
    </>
  );
}
