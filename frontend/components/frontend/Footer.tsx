import React from "react";
import ConversionSection from "@/components/frontend/sections/ConversionSection";

const Footer = () => {
  return (
    <>
      {/* <ConversionSection /> */}

      

      <div className="w-full bg-black site-footer overflow-hidden transition-colors duration-500">
        <div className="w-full grid grid-cols-4 p-20 justify-between relative z-30">
          <div className="relative z-20">
            <div className="text-gray-400 font-light mb-3 text-sm | md:text-base">
              SITEMAP
            </div>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <a
                  href="/"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Home
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/projects"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Work
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/about"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Agency
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/services"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Services
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/blog"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Journal
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/tools"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Tools
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/contact"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Start a Project
                </a>
              </li>
            </ul>
          </div>
          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              SERVICES
            </div>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <a
                  href="/services#brand-design"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Brand Design
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/services#illustration"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Illustration
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/services#web-design"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Web Design
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/services#product-design"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Product Design
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="/services#print-packaging"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Print & Packaging
                </a>
              </li>
            </ul>
          </div>
          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              SOCIAL
            </div>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <a
                  href="https://twitter.com/lhrweb"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Twitter/X
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://instagram.com/lhrweb"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Instagram
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://linkedin.com/company/lhrweb"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  LinkedIn
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://dribbble.com/lhrweb"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white relative link text-sm | md:text-base || group"
                >
                  Dribbble
                </a>
              </li>
            </ul>
          </div>
          <div className="w-full mb-10 flex flex-wrap flex-col lg:pl-0 lg:mb-0">
            <div className="text-gray-400 font-light mb-3 text-sm | md:text-base">
              Get in touch
            </div>
            <div className="flex flex-col items-start">
              <a
                href="tel:+923214516195"
                target="_blank"
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
                <div className="link text-sm | md:text-base">+92 321 4516195</div>
              </a>
              <a
                href="mailto:zahid@lhrweb.com"
                target="_blank"
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
                  zahid@lhrweb.com
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
                  <p className="text-sm | md:text-base text-white font-sans-primary relative z-10 text-pretty font-light leading-7  mb-6">
                    LHRWEB Digital
                    <br />1-C, Block 1, Johar Town
                    <br />
                    Lahore, Pakistan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full justify-center mb-10 hidden lg:flex lg:mb-5">
          <div className="text-white font-almiregodisplay leading-none tracking-tight text-3xl text-center lg:text-[10vw]">
            Crafting since 2023
          </div>
        </div>
        <div className="w-full flex flex-wrap items-center justify-between px-6 | lg:px-20 | xl:px-24">
          <div className="inline-flex flex-row items-start pr-8 | lg:space-x-5 lg:items-center">
            {/* <svg
            id="a"
            className="text-white fill-current w-16 h-8 hidden mb-1 | lg:inline-block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 253.89 72.05"
          >
            <path d="M40.67 28.36c-1.84-1.21-3.7-2.09-5.57-2.65-1.87-.55-3.33-.93-4.38-1.15-3.53-.9-6.39-1.63-8.57-2.21-2.19-.58-3.9-1.16-5.13-1.74-1.24-.58-2.07-1.21-2.49-1.9-.42-.68-.63-1.58-.63-2.69 0-1.21.26-2.21.79-3s1.2-1.45 2.01-1.98c.82-.53 1.72-.89 2.73-1.11 1-.21 2-.32 3-.32 1.53 0 2.94.13 4.23.4 1.29.26 2.44.71 3.44 1.34 1 .63 1.8 1.5 2.41 2.61.47.85.78 1.87.95 3.06.09.64.64 1.12 1.29 1.12h9.48c.76 0 1.36-.65 1.31-1.41-.16-2.66-.76-4.97-1.82-6.92a16.245 16.245 0 00-5.02-5.65c-2.11-1.47-4.52-2.54-7.23-3.2-2.71-.66-5.54-.99-8.49-.99-2.53 0-5.06.34-7.58 1.03-2.53.68-4.79 1.74-6.79 3.16-2 1.42-3.62 3.2-4.86 5.33s-1.86 4.65-1.86 7.54c0 2.58.49 4.78 1.46 6.6.97 1.82 2.25 3.33 3.83 4.54s3.37 2.2 5.37 2.96c2 .76 4.05 1.41 6.16 1.94 2.05.58 4.08 1.11 6.08 1.58s3.79 1.03 5.37 1.66 2.86 1.42 3.83 2.37 1.46 2.19 1.46 3.71c0 1.42-.37 2.59-1.11 3.52-.74.92-1.66 1.65-2.77 2.17-1.11.53-2.29.88-3.55 1.07-1.26.18-2.45.28-3.55.28-1.63 0-3.21-.2-4.74-.59-1.53-.39-2.86-1-3.99-1.82-1.13-.82-2.04-1.88-2.73-3.2-.54-1.03-.86-2.24-.98-3.63-.06-.67-.62-1.19-1.3-1.19H1.31c-.76 0-1.34.64-1.31 1.39.11 2.89.74 5.43 1.88 7.61 1.32 2.53 3.09 4.61 5.33 6.24s4.82 2.83 7.74 3.59c2.92.76 5.94 1.15 9.04 1.15 3.84 0 7.23-.45 10.15-1.34 2.92-.89 5.37-2.15 7.35-3.75 1.97-1.61 3.46-3.52 4.46-5.73 1-2.21 1.5-4.61 1.5-7.19 0-3.16-.67-5.75-2.01-7.78-1.34-2.03-2.94-3.65-4.78-4.86zm48.58-7.94c-1.11-1.45-2.62-2.58-4.54-3.4-1.92-.82-4.38-1.22-7.39-1.22-2.11 0-4.27.54-6.48 1.62-.27.13-.54.28-.8.43s-3.12 1.97-3.12 1.97a1.15 1.15 0 01-1.77-.97V2.65c0-.72-.59-1.31-1.31-1.31h-8.6c-.72 0-1.31.59-1.31 1.31v53.78c0 .72.59 1.31 1.31 1.31h8.6c.72 0 1.31-.59 1.31-1.31v-20.1c0-4.16.68-7.15 2.05-8.97 1.37-1.82 3.58-2.72 6.64-2.72 2.69 0 4.56.83 5.61 2.49 1.05 1.66 1.58 4.17 1.58 7.54v21.76c0 .72.59 1.31 1.31 1.31h8.6c.72 0 1.31-.59 1.31-1.31V32.62c0-2.53-.22-4.83-.67-6.91-.45-2.08-1.22-3.84-2.33-5.29zm48.82 33.54c-.21-1.68-.32-3.45-.32-5.29V27.42c0-2.47-.55-4.46-1.66-5.96-1.11-1.5-2.53-2.67-4.27-3.52-1.74-.84-3.66-1.41-5.77-1.7-2.11-.29-4.19-.43-6.24-.43-2.27 0-4.52.22-6.75.67-2.24.45-4.25 1.2-6.04 2.25a13.315 13.315 0 00-4.42 4.19c-.93 1.4-1.54 3.08-1.82 5.06-.11.79.51 1.5 1.3 1.5h8.63c.62 0 1.16-.44 1.28-1.05.32-1.67 1.01-2.9 2.06-3.69 1.26-.95 3-1.42 5.21-1.42 1 0 1.94.07 2.8.2.87.13 1.63.39 2.29.79.66.39 1.19.95 1.58 1.66.4.71.59 1.67.59 2.88.05 1.16-.29 2.04-1.03 2.65-.74.61-1.74 1.07-3 1.38-1.26.32-2.71.55-4.34.71-1.63.16-3.29.37-4.98.63-1.69.26-3.36.62-5.02 1.07-1.66.45-3.13 1.12-4.42 2.01-1.29.9-2.34 2.09-3.16 3.59-.82 1.5-1.22 3.41-1.22 5.73 0 2.11.36 3.92 1.07 5.45.71 1.53 1.7 2.79 2.96 3.79s2.74 1.74 4.42 2.21c1.68.47 3.5.71 5.45.71 2.53 0 5-.37 7.43-1.11 2.42-.74 4.53-2.03 6.32-3.87.05.69.14 1.36.28 2.01.07.34.14.67.23 1 .15.56.68.93 1.26.93h8.44c.86 0 1.5-.81 1.27-1.63a13.8 13.8 0 01-.42-2.16zm-11.53-12.01c0 .63-.07 1.47-.2 2.53-.13 1.05-.49 2.09-1.07 3.12-.58 1.03-1.48 1.91-2.69 2.65s-2.92 1.11-5.13 1.11c-.9 0-1.77-.08-2.61-.24-.84-.16-1.58-.43-2.21-.83a4.19 4.19 0 01-1.5-1.62c-.37-.68-.55-1.53-.55-2.53 0-1.05.18-1.92.55-2.61.37-.68.86-1.25 1.46-1.7.6-.45 1.32-.8 2.13-1.07.82-.26 1.65-.47 2.49-.63.9-.16 1.79-.29 2.69-.39.89-.11 1.75-.24 2.57-.4.82-.16 1.58-.36 2.29-.59.87-.29 1.78.36 1.78 1.28v1.92zm57.27-19.51c-1.53-2-3.45-3.61-5.77-4.82-2.32-1.21-5.08-1.82-8.29-1.82-2.53 0-4.85.5-6.95 1.5-.64.31-1.24.69-1.82 1.11l-1.76 1.09c-.77.49-1.77-.07-1.77-.98l-.02-.3c0-.72-.59-1.31-1.31-1.31h-8.04c-.72 0-1.31.59-1.31 1.31v52.52c0 .72.59 1.31 1.31 1.31h8.6c.72 0 1.31-.59 1.31-1.31V56.3c.01-.91 1.1-1.27 1.79-.98l2.38 1.22.05.03c.39.24.77.47 1.19.67 2.13 1.03 4.46 1.54 6.99 1.54 3 0 5.62-.58 7.86-1.74s4.11-2.71 5.61-4.66c1.5-1.95 2.62-4.19 3.36-6.71a27.98 27.98 0 001.11-7.9c0-2.9-.37-5.67-1.11-8.33-.74-2.66-1.87-4.99-3.4-6.99zm-7.19 19.83c-.32 1.58-.86 2.96-1.62 4.15a8.893 8.893 0 01-3 2.88c-1.24.74-2.78 1.11-4.62 1.11s-3.32-.37-4.58-1.11c-1.26-.74-2.28-1.7-3.04-2.88-.76-1.18-1.32-2.57-1.66-4.15-.34-1.58-.51-3.19-.51-4.82s.16-3.32.47-4.9c.32-1.58.85-2.97 1.62-4.19.76-1.21 1.76-2.2 3-2.96 1.24-.76 2.78-1.15 4.62-1.15s3.3.38 4.54 1.15c1.24.76 2.25 1.77 3.04 3 .79 1.24 1.36 2.65 1.7 4.23.34 1.58.51 3.19.51 4.82s-.16 3.24-.47 4.82zm53.05-19.04c-1.66-2.26-3.78-4.07-6.36-5.41-2.58-1.34-5.61-2.01-9.08-2.01-3.11 0-5.94.55-8.49 1.66-2.55 1.11-4.75 2.62-6.6 4.54-1.84 1.92-3.27 4.2-4.27 6.83-1 2.63-1.5 5.48-1.5 8.53s.49 6.06 1.46 8.69 2.36 4.9 4.15 6.79c1.79 1.9 3.98 3.36 6.56 4.38 2.58 1.03 5.48 1.54 8.69 1.54 4.63 0 8.58-1.05 11.85-3.16 2.85-1.84 5.06-4.74 6.62-8.71.34-.86-.3-1.8-1.22-1.8h-7.13c-.49 0-.94.27-1.16.71-.49 1-1.4 1.97-2.73 2.88-1.63 1.13-3.58 1.7-5.85 1.7-3.16 0-5.58-.82-7.27-2.45-1.45-1.4-2.33-3.55-2.65-6.43a1.32 1.32 0 011.31-1.47h26.79c.7 0 1.29-.55 1.31-1.25.07-2.71-.21-5.32-.85-7.83-.74-2.9-1.93-5.48-3.59-7.74zm-8.48 9.72h-15.08c-.84 0-1.46-.77-1.29-1.59.08-.35.17-.72.28-1.1.29-1 .79-1.95 1.5-2.84.71-.89 1.66-1.65 2.84-2.25 1.19-.6 2.67-.91 4.46-.91 2.74 0 4.78.74 6.12 2.21 1.07 1.18 1.88 2.78 2.43 4.83.22.83-.41 1.65-1.27 1.65z" />
            <rect
              x="241.48"
              y="45.58"
              width="12.4"
              height="12.17"
              rx="1.31"
              ry="1.31"
            />
          </svg> */}
            <div className="inline-flex flex-row text-gray-400 w-auto text-1xs | md:text-xs | lg:text-sm">
              <div>© Made By LHRWEB Ltd 2025</div>
              {/* <div className="mx-2 | lg:mx-5">|</div>
              <div>Company Reg Number 10529058</div> */}
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
            <div>All Rights Reserved</div>
            <div className="mx-2 | lg:mx-5">|</div>
            <a
              href="https://madebyshape.co.uk/privacy-policy/"
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
