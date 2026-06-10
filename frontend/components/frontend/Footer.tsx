"use client";

import React, { useState, useEffect } from "react";

interface FooterLink {
  title: string;
  url: string;
}

interface FooterData {
  sitemapLinks: FooterLink[];
  servicesLinks: FooterLink[];
  socialLinks: FooterLink[];
  phone: string;
  email: string;
  address: string;
  companyName: string;
  craftingText: string;
  privacyPolicyUrl: string;
  copyrightText: string;
}

const DEFAULT_FOOTER: FooterData = {
  sitemapLinks: [
    { title: "Home", url: "/" },
    { title: "Work", url: "/projects" },
    { title: "Agency", url: "/about" },
    { title: "Services", url: "/services" },
    { title: "Journal", url: "/blog" },
    { title: "Tools", url: "/tools" },
    { title: "Start a Project", url: "/contact" },
  ],
  servicesLinks: [
    { title: "Brand Design", url: "/services#brand-design" },
    { title: "Illustration", url: "/services#illustration" },
    { title: "Web Design", url: "/services#web-design" },
    { title: "Product Design", url: "/services#product-design" },
    { title: "Print & Packaging", url: "/services#print-packaging" },
  ],
  socialLinks: [
    { title: "Twitter/X", url: "https://twitter.com/lhrweb" },
    { title: "Instagram", url: "https://instagram.com/lhrweb" },
    { title: "LinkedIn", url: "https://linkedin.com/company/lhrweb" },
    { title: "Dribbble", url: "https://dribbble.com/lhrweb" },
  ],
  phone: "+92 321 4516195",
  email: "zahid@lhrweb.com",
  address: "LHRWEB Digital\n1-C, Block 1, Johar Town\nLahore, Pakistan",
  companyName: "Made By LHRWEB Ltd 2025",
  craftingText: "Crafting since 2023",
  privacyPolicyUrl: "https://madebyshape.co.uk/privacy-policy/",
  copyrightText: "All Rights Reserved",
};

const Footer = () => {
  const [data, setData] = useState<FooterData>(DEFAULT_FOOTER);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || `${API}`}/api/footer`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((fetchedData) => {
        setData((prev) => ({
          ...prev,
          ...fetchedData,
        }));
      })
      .catch((err) => console.error("Error loading dynamic footer:", err));
  }, []);

  return (
    <>
      <div className="w-full bg-black site-footer overflow-hidden transition-colors duration-500">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 p-8 md:p-14 lg:p-20 relative z-30">
          <div className="relative z-20">
            <div className="text-gray-400 font-light mb-3 text-sm | md:text-base">
              SITEMAP
            </div>
            <ul className="space-y-1">
              {data.sitemapLinks.map((link, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <a
                    href={link.url}
                    className="text-white relative link text-sm | md:text-base || group"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              SERVICES
            </div>
            <ul className="space-y-1">
              {data.servicesLinks.map((link, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <a
                    href={link.url}
                    className="text-white relative link text-sm | md:text-base || group"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              SOCIAL
            </div>
            <ul className="space-y-1">
              {data.socialLinks.map((link, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white relative link text-sm | md:text-base || group"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap flex-col">
            <div className="text-gray-400 font-light mb-3 text-sm | md:text-base">
              Get in touch
            </div>
            <div className="flex flex-col items-start">
              <a
                href={`tel:${data.phone.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-4 mb-1 text-white text-sm | lg:text-base"
              >
                <svg
                  className="w-3 h-3 fill-current | 4xl:w-3.5 4xl:h-3.5"
                  width={16}
                  height={16}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M0 32L144 0l80 144-83.8 67c36.1 68.4 92.3 124.6 160.8 160.8l67-83.8 144 80-32 144h-32C200.6 512 0 311.4 0 64V32z" />
                </svg>
                <div className="link text-sm | md:text-base">{data.phone}</div>
              </a>
              <a
                href={`mailto:${data.email}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-4 text-white"
              >
                <svg
                  className="w-3 h-3 fill-current | 4xl:w-3.5 4xl:h-3.5"
                  width={16}
                  height={16}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M0 64h512v80L256 320 0 144V64zm0 384V182.8l237.9 163.6 18.1 12.4 18.1-12.5L512 182.8V448H0z" />
                </svg>
                <div className="link text-sm | md:text-base">
                  {data.email}
                </div>
              </a>
              <div className="flex space-x-4 mt-6 mb-1 | lg:mb-2">
                <svg
                  className="w-3 h-3 fill-current mt-1 | 4xl:w-3.5 4xl:h-3.5"
                  width={12}
                  height={16}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                >
                  <path d="M192 512s192-208 192-320C384 86 298 0 192 0S0 86 0 192c0 112 192 320 192 320zm0-384a64 64 0 110 128 64 64 0 110-128z" />
                </svg>
                <div className="w-full relative ">
                  <p className="text-sm | md:text-base text-white font-sans-primary relative z-10 text-pretty font-light leading-7 mb-6">
                    {data.address.split("\n").map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full justify-center mb-10 hidden lg:flex lg:mb-5">
          <div className="heading text-white font-almiregodisplay leading-none tracking-tight text-3xl text-center lg:text-[10vw]">
            {data.craftingText}
          </div>
        </div>
        <div className="w-full flex flex-wrap items-center justify-between px-6 | lg:px-20 | xl:px-24 pb-8">
          <div className="inline-flex flex-row items-start pr-8 | lg:space-x-5 lg:items-center">
            <div className="inline-flex flex-row text-gray-400 w-auto text-1xs | md:text-xs | lg:text-sm">
              <div>© {data.companyName}</div>
            </div>
          </div>
          <div className="inline-flex flex-row text-gray-400 w-auto text-1xs | md:text-xs | lg:text-sm">
            <a
              href="https://www.lhrweb.com/"
              className="link | xl:hover:text-white | lg:dark:hover:text-grayDark-100"
            >
              Web Design Manchester
            </a>
            <div className="mx-2 | lg:mx-5">|</div>
            <div>{data.copyrightText}</div>
            <div className="mx-2 | lg:mx-5">|</div>
            <a
              href={data.privacyPolicyUrl}
              className="link | xl:hover:text-white | lg:dark:hover:text-grayDark-100"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
