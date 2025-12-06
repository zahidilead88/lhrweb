import type { Metadata } from "next";

import "../globals.css";
// import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "nextjs with nodejs",
  description: "nextjs with nodejs",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        {/* <Toaster /> */}
        {children}
      </body>
    </html>
  );
}
