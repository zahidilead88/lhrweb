import React, { useState } from "react";

const HomeFaq = ({ section }: { section: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!section) return null;

  const toggleAccordion = (index: number) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };
  return (
    <div className="px-6 md:px-10 lg:px-16 py-24">
      {section.title && (
        <h2 className="heading text-4xl md:text-5xl font-bold mb-12">{section.title}</h2>
      )}
      <div className="max-w-3xl mx-auto divide-y divide-gray-200">
        {section?.accordion?.map((item: any, index: number) => (
          <div key={index}>
            <button
              type="button"
              className="w-full flex justify-between items-center py-5 text-left"
              onClick={() => toggleAccordion(index)}
            >
              <span className="text-lg font-medium">{item.title}</span>
              <span
                className={`ml-4 flex-shrink-0 w-8 h-8 border border-gray-300 rounded-md flex items-center justify-center transition-transform duration-300 ${
                  openIndex === index ? "rotate-90" : ""
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z" fill="currentColor" />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-96 pb-5" : "max-h-0"
              }`}
            >
              <p className="text-gray-600 leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeFaq;
