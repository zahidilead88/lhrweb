"use client";
import { useEffect, useState } from "react";
import SectionRenderer from "./SectionRenderer";

interface PageData {
  sections: any[];
  blogs?: any[];
  projects?: any[];
}

interface PageSectionsProps {
  page: string;
  initialData?: PageData;
}

export default function PageSections({ page, initialData }: PageSectionsProps) {
  const [data, setData] = useState<PageData>(initialData ?? { sections: [] });

  useEffect(() => {
    if (initialData) return;
    fetch(`http://localhost:8000/api/pages/${page}`)
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d?.sections)) {
          setData({
            sections: d.sections,
            blogs:    d.blogs,
            projects: d.projects,
          });
        }
      })
      .catch(() => {});
  }, [page, initialData]);

  const extras = { blogs: data.blogs, projects: data.projects };

  return (
    <>
      {data.sections.map((section) => (
        <SectionRenderer key={section._id} section={section} extras={extras} />
      ))}
    </>
  );
}
