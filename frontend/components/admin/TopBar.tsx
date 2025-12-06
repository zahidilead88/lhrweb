"use client";
import { useRouter } from "next/navigation";

const TopBar = () => {
  const router = useRouter();

  // 🔓 Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin/login");
  };

  return (
    <>
      <header className="bg-[#ededed] p-4 flex justify-between items-center fixed top-0 w-[82%]">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </header>
    </>
  );
};

export default TopBar;
