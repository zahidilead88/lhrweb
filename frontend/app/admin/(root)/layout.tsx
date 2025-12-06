// app/admin/layout.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import TopBar from "@/components/admin/TopBar";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthRoute = pathname.startsWith("/admin");

    if (!token && !isAuthRoute) {
      router.replace("/admin/login"); // use replace to remove history
    } else {
      setLoading(false); // allow rendering
    }
  }, [pathname, router]);

  // prevent rendering while checking token
  if (loading) return null;
  return (
    <div className="flex h-screen bg-[#ededed]">
      {/* Sidebar */}
      <aside className="w-[18%] bg-[#ededed] flex flex-col p-4 fixed top-0 bottom-0">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="hover:bg-gray-200 p-2 rounded">
            Dashboard
          </Link>
          <Link href="/admin/menu" className="hover:bg-gray-200 p-2 rounded">
            Manage Menu
          </Link>
          <Link href="/admin/users" className="hover:bg-gray-200 p-2 rounded">
            Users
          </Link>
          <Link href="/admin/blog" className="block p-2 hover:bg-gray-200">
            Manage Blogs
          </Link>
          <Link href="/admin/project" className="block p-2 hover:bg-gray-200">
            Manage Projects
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="w-[82%] ml-[18%]">
        {/* Topbar */}
        <TopBar />
        {/* Page content */}
        <main className="flex-1 p-6 bg-white min-h-[95vh] mt-[80px]">
          {children}
        </main>
      </div>
    </div>
  );
}
