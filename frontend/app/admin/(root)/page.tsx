"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Counts    { pages: number; blogs: number; projects: number; sections: number; }
interface Analytics { totalUsers: number; activeSubscriptions: number; newUsersThisMonth: number; totalSites: number; }

const S = {
  card:  { background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 } as React.CSSProperties,
  label: { color: "#9aa0a6", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" },
};

function StatCard({ label, value, href, action }: { label: string; value: number; href: string; action: string }) {
  return (
    <div className="p-5 flex flex-col justify-between gap-6" style={S.card}>
      <div>
        <p style={S.label} className="mb-3">{label}</p>
        <span className="text-[40px] font-bold leading-none" style={{ color: "#e8eaed" }}>{value}</span>
      </div>
      <Link href={href} className="flex items-center justify-between text-[12px] pt-4 transition-colors group" style={{ color: "#9aa0a6", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {action}<span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}

export default function AdminDashboard() {
  const [counts,    setCounts]    = useState<Counts>({ pages: 0, blogs: 0, projects: 0, sections: 0 });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/pages`).then((r) => r.json()),
      fetch(`${API}/api/blogs`).then((r) => r.json()),
      fetch(`${API}/api/projects`).then((r) => r.json()),
      fetch(`${API}/api/sections`).then((r) => r.json()),
    ]).then(([pages, blogs, projects, sections]) => {
      setCounts({
        pages:    Array.isArray(pages)    ? pages.length    : 0,
        blogs:    Array.isArray(blogs)    ? blogs.length    : 0,
        projects: Array.isArray(projects) ? projects.length : 0,
        sections: Array.isArray(sections) ? sections.length : 0,
      });
    }).catch(() => {});

    const token = localStorage.getItem("token");
    fetch(`${API}/api/builder/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setAnalytics(d))
      .catch(() => {});
  }, []);

  const quickLinks = [
    { label: "Pages",         href: "/admin/pages"    },
    { label: "Blog",          href: "/admin/blog"     },
    { label: "Projects",      href: "/admin/project"  },
    { label: "Leads",         href: "/admin/leads"    },
    { label: "Users",         href: "/admin/users"    },
    { label: "Builder Sites", href: "/admin/sites"    },
    { label: "Footer",        href: "/admin/footer"   },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "#e8eaed" }}>Dashboard</h1>
        <p className="text-[13px]" style={{ color: "#9aa0a6" }}>Welcome back. Here&apos;s an overview of your site.</p>
      </div>

      {/* CMS stats */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#5f6368" }}>Content</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pages"      value={counts.pages}    href="/admin/pages"        action="Manage Pages"  />
          <StatCard label="Sections"   value={counts.sections} href="/admin/sections/add" action="Add Section"   />
          <StatCard label="Projects"   value={counts.projects} href="/admin/project/add"  action="Add Project"   />
          <StatCard label="Blog Posts" value={counts.blogs}    href="/admin/blog/add"     action="Add Blog Post" />
        </div>
      </div>

      {/* Business analytics */}
      {analytics && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#5f6368" }}>Business</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"       value={analytics.totalUsers}          href="/admin/users" action="View Users"    />
            <StatCard label="Active Subs"       value={analytics.activeSubscriptions} href="/admin/users" action="View Billing"  />
            <StatCard label="New (30 days)"     value={analytics.newUsersThisMonth}   href="/admin/users" action="View Users"    />
            <StatCard label="Builder Sites"     value={analytics.totalSites}          href="/admin/sites" action="View Sites"    />
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 p-5" style={S.card}>
          <p className="text-[12px] font-semibold mb-4 pb-4" style={{ ...S.label, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            Quick Access
          </p>
          <div className="space-y-0.5">
            {quickLinks.map(({ label, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors"
                style={{ color: "#9aa0a6" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#e8eaed"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; }}
              >
                {label}<span style={{ opacity: 0.4 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
