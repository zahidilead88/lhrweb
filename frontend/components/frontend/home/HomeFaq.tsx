import React, { useState } from "react";

const HomeFaq = ({ section }) => {
  if (!section) return null;
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };
  return (
    <div className="p-4 grid grid-cols-12">
      <h3 className="font-almiregodisplay text-[3.5vw] leading-none col-span-12">
        We love talking shop and answering questions. See the most common
        inquiries below or book a call.
      </h3>
      <div className="my-10 col-span-8 col-start-3">
        <h1 className="text-[2vw]">{section.title}</h1>
        {section?.accordion ? (
          <>
            {section?.accordion.map((items, index) => (
              <div className="border-b border-b-black" key={index}>
                <div className="border-t border-t-black py-3 group">
                  <div
                    className="flex justify-between text-center text-[24px] leading-10"
                    onClick={() => toggleAccordion(index)}
                  >
                    {items.title}
                    <span className="border border-[#000] p-4 w-[50px] h-[50px] rounded-md">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className=""
                      >
                        <path
                          d="M14 4.24128V0.471254C14 0.34627 13.9503 0.226405 13.862 0.138028C13.7736 0.0496505 13.6537 7.54619e-07 13.5287 7.54619e-07L9.75872 7.54619e-07C9.66539 -0.000166225 9.57411 0.0273818 9.49646 0.0791523C9.41881 0.130923 9.35828 0.204584 9.32254 0.290799C9.2868 0.377013 9.27747 0.471897 9.29572 0.563423C9.31398 0.654948 9.35899 0.738993 9.42507 0.804902L10.9774 2.35627L0 13.3327L0.667295 14L11.6437 3.02262L13.1951 4.57493C13.261 4.64101 13.3451 4.68602 13.4366 4.70428C13.5281 4.72253 13.623 4.7132 13.7092 4.67746C13.7954 4.64172 13.8691 4.58119 13.9208 4.50354C13.9726 4.42589 14.0002 4.33461 14 4.24128Z"
                          fill="black"
                        />
                      </svg>
                    </span>
                  </div>
                  {openIndex === index && (
                    <p className="hidden">{items.content}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default HomeFaq;
