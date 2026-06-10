"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNewLeadsCount } from "@/store/leadsSlice";

const TopBar = () => {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const newCount = useAppSelector((s) => s.leads.newCount);

  useEffect(() => {
    dispatch(fetchNewLeadsCount());
    const id = setInterval(() => dispatch(fetchNewLeadsCount()), 30_000);
    return () => clearInterval(id);
  }, [dispatch]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/admin/login");
  };

  return (
    <header
      className="h-14 flex justify-between items-center px-6 fixed top-0 right-0 left-[220px] z-40"
      style={{ background: "#111111", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div />
      <div className="flex items-center gap-1">
        <Link
          href="/admin/leads"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: "#9aa0a6" }}
          title="Leads"
        >
          <Bell size={16} />
          {newCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-[9px] font-bold rounded-full flex items-center justify-center px-1"
              style={{ background: "#ea4335", color: "#fff" }}
            >
              {newCount > 99 ? "99+" : newCount}
            </span>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "#9aa0a6" }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default TopBar;
