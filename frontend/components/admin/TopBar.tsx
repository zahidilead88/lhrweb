"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNewLeadsCount } from "@/store/leadsSlice";

const TopBar = () => {
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const newCount  = useAppSelector((s) => s.leads.newCount);

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
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 h-16 flex justify-between items-center fixed top-0 w-[82%] z-40 transition-all">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-gray-900">Admin Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/admin/leads"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
          title="Leads"
        >
          <Bell size={18} />
          {newCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {newCount > 99 ? "99+" : newCount}
            </span>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className="text-[12px] font-semibold text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default TopBar;
