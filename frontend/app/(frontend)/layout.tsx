import Header from "@/components/frontend/Header";
import "../globals.css";
import "./styles.css";
import Footer from "@/components/frontend/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
