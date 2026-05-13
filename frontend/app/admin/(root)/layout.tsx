// app/admin/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

const NAV_ITEMS = [
  { href: "/admin",          label: "Dashboard",       exact: true,  permission: null        },
  { href: "/admin/pages",    label: "Pages",           exact: false, permission: "pages"     },
  { href: "/admin/sections", label: "Structure",       exact: false, permission: "sections"  },
  { href: "/admin/menu",     label: "Manage Menu",     exact: false, permission: "menu"      },
  { href: "/admin/services", label: "Offerings",       exact: false, permission: "services"  },
  { href: "/admin/blog",     label: "Manage Blogs",    exact: false, permission: "blog"      },
  { href: "/admin/project",  label: "Manage Projects", exact: false, permission: "projects"  },
  { href: "/admin/leads",    label: "Leads",           exact: false, permission: null         },
  { href: "/admin/users",    label: "Users",           exact: false, permission: "admin-only" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const newCount   = useAppSelector((s) => s.leads.newCount);
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
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-[18%] bg-white border-r border-gray-100 flex flex-col p-6 fixed top-0 bottom-0 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">LHRWEB</h2>
        </div>
        
        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.filter((item) => canAccess(item.permission)).map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const isLeads = href === "/admin/leads";
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-black text-white shadow-sm translate-x-1"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {label}
                {isLeads && newCount > 0 && (
                  <span className={`min-w-[20px] h-5 text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none ${active ? "bg-white text-black" : "bg-red-500 text-white"}`}>
                    {newCount > 99 ? "99+" : newCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-50">
          <p className="px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</p>
          <Link href="/admin/help" className="flex items-center px-4 py-2 text-[13px] text-gray-500 hover:text-black transition-colors">Documentation</Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="w-[82%] ml-[18%] flex flex-col h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] p-8 mt-[64px]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
