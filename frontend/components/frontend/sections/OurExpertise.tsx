const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";

const OurExpertise = ({ section }: { section: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    // If section data is not yet available, don't set up observer
    if (!section || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.classList.add("bg-dark");
        } else {
          document.body.classList.remove("bg-dark");
        }
      },
      { 
        threshold: 0.5,
        rootMargin: "0px" 
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      document.body.classList.remove("bg-dark");
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      observer.disconnect();
    };
  }, [section]); // Re-run when section data loads

  if (!section) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div ref={sectionRef} className="p-4 min-h-screen flex flex-col justify-center transition-colors duration-500">
      <h2 className="heading font-almiregodisplay text-[5vw]">{section.title}</h2>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-4">
          <p className="opacity-80">{section.description}</p>
          {section.image && (
            <Image
              className="mt-5 rounded-2xl bg-gray-50 h-auto md:h-[90%] object-cover"
              src={`${API}/${section.image}`}
              alt={section.title || "Expertise Image"}
              width={500}
              height={500}
            />
          )}
        </div>
        <div className="col-span-12 md:col-span-8">
          <p className="heading text-[28px] md:text-[36px] font-almiregodisplay mb-8">
            {section.shortDescription}
          </p>
          
          {section?.accordion ? (
            <div className="space-y-0">
              {section?.accordion.map((item: any, index: number) => (
                <div
                  className="w-full border-b border-b-[#AEAEAE] hover:border-b-white transition-colors duration-300"
                  key={index}
                >
                  <div 
                    className="heading text-[5vw] leading-[1.2] py-1 md:leading-[18vh] font-almiregodisplay flex justify-between items-center group cursor-pointer"
                    onClick={() => toggleAccordion(index)}
                  >
                    {item.title}
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className={`border border-current p-4 w-[40px] h-[40px] md:w-[60px] md:h-[60px] rounded-md transition-transform duration-500 ${
                          openIndex === index ? "rotate-180" : "rotate-0"
                        }`}
                      >
                        <path
                          d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                  {openIndex === index && (
                    <div className="pb-8">
                      <p className="w-full text-base md:text-lg opacity-80 leading-relaxed">{item.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No expertise items found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OurExpertise;
