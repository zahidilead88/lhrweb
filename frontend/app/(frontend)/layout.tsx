import Header from "@/components/frontend/Header";
import "../globals.css";
import "./styles.css";
import Footer from "@/components/frontend/Footer";
import SmoothScroll from "@/components/frontend/SmoothScroll";
import LeadPopup from "@/components/frontend/LeadPopup";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      <div className="site-content">
        <Header />
        {children}
        <Footer />
        <LeadPopup />
      </div>
    </SmoothScroll>
  );
}
