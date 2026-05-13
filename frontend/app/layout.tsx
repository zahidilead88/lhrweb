import type { Metadata } from "next";
import { Inter, Titillium_Web } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ReduxProvider } from "@/store/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const titilliumWeb = Titillium_Web({
  variable: "--font-titilliumWeb",
  weight: "400",
  subsets: ["latin"],
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
      <body className={`${inter.variable} ${titilliumWeb.variable} ${AlmiregoDisplay.variable} font-inter font-light antialiased`}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
