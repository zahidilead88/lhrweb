// app/admin/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

const NAV_ITEMS = [
  { href: "/admin",          label: "Dashboard",       exact: true,  permission: null         },
  { href: "/admin/pages",    label: "Pages",           exact: false, permission: "pages"      },
  { href: "/admin/sections", label: "Structure",       exact: false, permission: "sections"   },
  { href: "/admin/menu",     label: "Manage Menu",     exact: false, permission: "menu"       },
  { href: "/admin/services", label: "Offerings",       exact: false, permission: "services"   },
  { href: "/admin/blog",     label: "Manage Blogs",    exact: false, permission: "blog"       },
  { href: "/admin/project",  label: "Manage Projects", exact: false, permission: "projects"   },
  { href: "/admin/footer",   label: "Manage Footer",   exact: false, permission: "menu"       },
  { href: "/admin/leads",    label: "Leads",           exact: false, permission: null          },
  { href: "/admin/users",    label: "Users",           exact: false, permission: "admin-only" },
  { href: "/admin/sites",    label: "Builder Sites",   exact: false, permission: "admin-only" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const newCount = useAppSelector((s) => s.leads.newCount);
  const [loading, setLoading]         = useState(true);
  const [role, setRole]               = useState<string>("user");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/admin/login"); return; }
    const storedRole = localStorage.getItem("role") || "user";
    if (storedRole !== "admin") { router.replace("/dashboard"); return; }
    setRole(storedRole);
    setPermissions(JSON.parse(localStorage.getItem("permissions") || "[]"));
    setLoading(false);
  }, [pathname, router]);

  const canAccess = (permission: string | null): boolean => {
    if (role === "admin") return true;
    if (permission === null) return true;
    if (permission === "admin-only") return false;
    return permissions.includes(permission);
  };

  useEffect(() => {
    if (loading) return;
    const current = NAV_ITEMS.find((item) =>
      item.exact ? pathname === item.href : (pathname.startsWith(item.href) && item.href !== "/admin")
    );
    if (current && !canAccess(current.permission)) router.replace("/admin");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pathname]);

  if (loading) return null;

  return (
    <div className="flex h-screen" style={{ background: "#111111" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="w-[220px] flex flex-col fixed top-0 bottom-0 z-50 select-none"
        style={{ background: "#111111", borderRight: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Brand */}
        <div className="h-14 flex items-center px-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "#a8c7fa" }}>
              <span className="text-[11px] font-black text-black">L</span>
            </div>
            <span className="text-[14px] font-semibold" style={{ color: "#e8eaed" }}>LHRWEB</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.filter((item) => canAccess(item.permission)).map(({ href, label, exact }) => {
            const active  = exact ? pathname === href : pathname.startsWith(href);
            const isLeads = href === "/admin/leads";
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-all mb-0.5"
                style={{
                  color:      active ? "#a8c7fa" : "#9aa0a6",
                  background: active ? "rgba(168,199,250,0.1)" : "transparent",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#e8eaed"; }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; } }}
              >
                {label}
                {isLeads && newCount > 0 && (
                  <span className="min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1" style={{ background: "#ea4335", color: "#fff" }}>
                    {newCount > 99 ? "99+" : newCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom utility links */}
        <div className="py-3 px-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { label: "Documentation", href: "/admin/help" },
          ].map(({ label, href }) => (
            <Link key={label} href={href}
              className="flex items-center px-3 py-2 rounded-lg text-[13px] transition-all"
              style={{ color: "#9aa0a6" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#e8eaed"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9aa0a6"; }}
            >
              {label}
            </Link>
          ))}
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 ml-[220px] flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8 mt-14" style={{ background: "#111111" }}>
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
