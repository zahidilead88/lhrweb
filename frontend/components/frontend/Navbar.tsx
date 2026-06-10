"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Define TypeScript interfaces
interface SubLink {
  label: string;
  url?: string;
}

interface MenuItem {
  _id?: string;
  title: string;
  url?: string;
  sublinks?: SubLink[];
}

export default function Navbar() {
  const [menus, setMenus] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || `${API}`}/api/menu`)
      .then((res) => res.json())

      .then((data: MenuItem[]) => setMenus(data))
      .catch((err) => console.error("Failed to fetch menu:", err));
  }, []);

  return (
    <nav className="">
      <ul className="flex gap-10 items-center">
        {menus.map((menu) => (
          <li key={menu._id || menu.title} className="relative group">
            {menu.url ? (
              <Link href={menu.url} className="link">
                {menu.title}
              </Link>
            ) : (
              <span>{menu.title}</span>
            )}
            {Array.isArray(menu.sublinks) && menu.sublinks.length > 0 && (
              <ul className="absolute hidden group-hover:block bg-white shadow-md mt-2 rounded">
                {menu.sublinks.map((sub, idx) => (
                  <li key={idx}>
                    {sub.url ? (
                      <Link
                        className="block px-4 py-2 hover:bg-gray-100"
                        href={sub.url}
                      >
                        {sub.label}
                      </Link>
                    ) : (
                      <span className="block px-4 py-2 text-gray-500">
                        {sub.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
