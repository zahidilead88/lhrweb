// app/admin/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin",          label: "Dashboard",       exact: true,  permission: null        },
  { href: "/admin/pages",    label: "Pages",           exact: false, permission: "pages"     },
  { href: "/admin/sections", label: "Manage Sections", exact: false, permission: "sections"  },
  { href: "/admin/menu",     label: "Manage Menu",     exact: false, permission: "menu"      },
  { href: "/admin/blog",     label: "Manage Blogs",    exact: false, permission: "blog"      },
  { href: "/admin/project",  label: "Manage Projects", exact: false, permission: "projects"  },
  { href: "/admin/users",    label: "Users",           exact: false, permission: "admin-only" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [loading, setLoading]           = useState(true);
  const [role, setRole]                 = useState<string>("user");
  const [permissions, setPermissions]   = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/admin/login"); return; }

    const storedRole  = localStorage.getItem("role") || "user";
    const storedPerms = JSON.parse(localStorage.getItem("permissions") || "[]");
    setRole(storedRole);
    setPermissions(storedPerms);
    setLoading(false);
  }, [pathname, router]);

  const canAccess = (permission: string | null): boolean => {
    if (role === "admin") return true;
    if (permission === null) return true;        // Dashboard always visible
    if (permission === "admin-only") return false; // Users page: admin only
    return permissions.includes(permission);
  };

  // Redirect if the user navigates directly to a restricted page
  useEffect(() => {
    if (loading) return;
    const current = NAV_ITEMS.find((item) =>
      item.exact ? pathname === item.href : (pathname.startsWith(item.href) && item.href !== "/admin")
    );
    if (current && !canAccess(current.permission)) {
      router.replace("/admin");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pathname]);

  if (loading) return null;

  return (
    <div className="flex h-screen bg-[#ededed]">
      {/* Sidebar */}
      <aside className="w-[18%] bg-[#ededed] flex flex-col p-4 fixed top-0 bottom-0">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => canAccess(item.permission)).map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`p-2 rounded text-sm transition-colors ${
                  active
                    ? "bg-black text-white font-semibold"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="w-[82%] ml-[18%]">
        <TopBar />
        <main className="flex-1 p-6 bg-white min-h-[95vh] mt-[80px]">
          {children}
        </main>
      </div>
    </div>
  );
}
