"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Shrink on scroll
      setIsScrolled(currentScrollY > 5);

      // Show/hide on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-2xl text-center sticky top-3 transition-all duration-300 z-50
        ${isScrolled ? "w-[80vw] bg-white/50 backdrop-blur-md shadow-sm" : "w-[98vw]"}
        ${isVisible ? "translate-y-0" : "-translate-y-[120%]"} 
        mx-auto transform`}
    >
      <Link href={"/"} className="flex gap-5 items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
        >
          <path
            d="M1.09278e-07 8.30044C1.09278e-07 7.47306 1.00164 7.11161 1.57404 7.60107C1.7238 7.72913 1.80543 7.91601 1.88428 8.09658V8.09658C2.67285 9.90232 3.73955 11.6618 3.85326 13.6289C3.88978 14.2607 3.8764 14.9077 3.8764 15.5596V47.5848C3.8764 48.9187 3.88071 50 2.5 50C1.11929 50 1.09278e-07 48.9187 1.09278e-07 47.5848V8.30044Z"
            fill="currentColor"
          />
          <path
            d="M19.9122 46.0869C21.3414 46.0869 22.5 46.1193 22.5 47.5C22.5 48.8807 21.3414 50 19.9122 50H2.58779C1.15859 50 -6.03529e-08 48.8807 0 47.5C6.03529e-08 46.1193 1.15859 46.0869 2.58779 46.0869H19.9122Z"
            fill="currentColor"
          />
          <path
            d="M40.5294 23.0619C41.9481 23.0619 43.0981 23.6294 43.0981 25C43.0981 26.3706 41.9481 26.9381 40.5294 26.9381L31.9668 26.9381C30.5481 26.9381 29.3981 26.3706 29.3981 25C29.3981 23.6294 30.5481 23.0619 31.9668 23.0619L40.5294 23.0619Z"
            fill="currentColor"
          />
          <path
            d="M47.4122 46.0869C48.8414 46.0869 50 46.1193 50 47.5C50 48.8807 48.8414 50 47.4122 50H30.0878C28.6586 50 27.5 48.8807 27.5 47.5C27.5 46.1193 28.6586 46.0869 30.0878 46.0869H47.4122Z"
            fill="currentColor"
          />
          <path
            d="M47.4122 9.75831e-07C48.8414 1.0383e-06 50 1.11929 50 2.5C50 3.88071 48.8414 3.91304 47.4122 3.91304L25.0878 3.91304C23.6586 3.91304 22.5 3.88071 22.5 2.5C22.5 1.11929 23.6586 -6.24722e-08 25.0878 0L47.4122 9.75831e-07Z"
            fill="currentColor"
          />
          <path
            d="M46.1236 2.41519C46.1236 1.08132 46.1193 1.08895e-06 47.5 1.08895e-06C48.8807 1.08895e-06 50 1.08132 50 2.41519V47.5848C50 48.9187 48.8807 50 47.5 50C46.1193 50 46.1236 48.9187 46.1236 47.5848V2.41519Z"
            fill="currentColor"
          />
          <path
            d="M23.0618 10.6652C23.0618 9.33132 23.6193 8.25001 25 8.25001C26.3807 8.25001 26.9382 9.33132 26.9382 10.6652V39.3348C26.9382 40.6687 26.3807 41.75 25 41.75C23.6193 41.75 23.0618 40.6687 23.0618 39.3348V10.6652Z"
            fill="currentColor"
          />
          <path
            d="M10.6581 0.259806C9.69938 0.282933 8.90843 0.700121 8.40337 1.57096C7.88569 2.47116 7.90824 3.39271 8.46019 4.27067C9.77424 6.36016 11.1054 8.43809 12.4285 10.5214C12.699 10.9474 12.9633 11.3797 13.2465 11.7978C13.6224 12.3696 14.2098 12.7741 14.8837 12.9252C15.5575 13.0762 16.2644 12.9618 16.854 12.6064C18.0995 11.8494 18.5162 10.275 17.7406 9.03407C16.1551 6.48707 14.547 3.95252 12.9164 1.43042C12.414 0.650307 11.652 0.274038 10.6581 0.259806Z"
            fill="currentColor"
          />
          <path
            d="M2.61554 0.259805C1.64633 0.282948 0.858685 0.719113 0.362792 1.58699C-0.148458 2.4878 -0.11594 3.41176 0.438666 4.29032C1.85439 6.5287 3.27643 8.76382 4.7048 10.9957C4.88545 11.2841 5.0661 11.5796 5.2594 11.8591C5.65137 12.4189 6.24903 12.8064 6.92584 12.9395C7.60265 13.0727 8.30547 12.941 8.8855 12.5725C9.46554 12.2039 9.87725 11.6273 10.0335 10.9648C10.1897 10.3024 10.0781 9.60599 9.72244 9.02314C8.13992 6.50496 6.53572 3.99568 4.93061 1.48908C4.40943 0.676386 3.64255 0.274047 2.61554 0.259805Z"
            fill="currentColor"
          />
          <path
            d="M18.9299 5.19603C20.3517 5.18915 21.5026 4.08394 21.5 2.72844C21.5 1.35231 20.3182 0.2428 18.8833 0.260002C17.4483 0.277204 16.3175 1.37037 16.3193 2.73188C16.321 4.11318 17.4764 5.20463 18.9299 5.19603Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      <Navbar />
      <div className="flex items-center gap-4 justify-end w-[20%]">
        <ThemeToggle />
        <Link
          href="#"
          className="bg-black text-white px-6 py-3 rounded-md text-center relative group overflow-hidden transition-all hover:pr-10"
        >
          <span className="relative z-10">get in touch</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all"
          >
            <path
              d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z"
              fill="white"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default Header;
