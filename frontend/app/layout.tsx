import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const titilliumWeb = Titillium_Web({
  variable: "--titilliumWeb",
  weight: "400",
});

const AlmiregoDisplay = localFont({
  src: [
    { path: "../public/fonts/AlmiregoDisplayLight.ttf", weight: "400" },
    { path: "../public/fonts/AlmiregoDisplayRegular.ttf", weight: "300" },
    {
      path: "../public/fonts/AlmiregoDisplayBold.ttf",
      weight: "200",
    },
  ],
  variable: "--font-AlmiregoDisplay",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LHRWEB",
  description: "Web Hosting, Design, Development and Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${titilliumWeb.variable} ${AlmiregoDisplay.variable}`}>
        {children}
      </body>
    </html>
  );
}
