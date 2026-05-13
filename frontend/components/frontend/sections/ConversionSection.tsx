"use client";
import { useState } from "react";

export default function ConversionSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    {
      text: "Add your first product",
      images: [
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/36138f611ff7a9bb25d679290f623a99.jpg?originalWidth=562&originalHeight=750",
          alt: "Employee entering product details on phone",
        },
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/890dbeb471a10637528a72179b12bfa9.jpg?originalWidth=575&originalHeight=795",
          alt: "Employee editing store on laptop",
        },
      ],
    },
    {
      text: "Customize your store",
      images: [
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/bcb8bcb289a7335a482b0769b77ab421.jpg?originalWidth=575&originalHeight=794",
          alt: "Employee customizing store on laptop",
        },
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/300722606d1783ce51852b40d584070f.jpg?originalWidth=576&originalHeight=746",
          alt: "Employee editing eyewear store",
        },
      ],
    },
    {
      text: "Set up payments",
      images: [
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/ce0048c94b712ae773a1f6371ced6303.jpg?originalWidth=576&originalHeight=747",
          alt: "Employee selling handbag at counter",
        },
        {
          src: "https://cdn.shopify.com/b/shopify-brochure2-assets/40d644720a7389ef0cd1809052ae9dda.jpg?originalWidth=575&originalHeight=794",
          alt: "Employee showing phone total to customer",
        },
      ],
    },
  ];

  return (
    <section className="grid gap-y-10 grid-cols-1 md:grid-cols-12 bg-conversion-gradient rounded-t-4xl p-10">
      {/* Images */}
      <div className="col-span-6 flex justify-center items-center relative">
        <div className="flex gap-4 flex-wrap justify-center">
          {steps[activeIndex].images.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className="rounded-xl object-cover w-40 h-56 md:w-56 md:h-72 transition-opacity duration-500"
            />
          ))}
        </div>
      </div>

      {/* List */}
      <div className="col-span-6 flex flex-col justify-center space-y-6">
        <h2 className="text-3xl mb-6">Start selling in no time</h2>
        {steps.map((step, i) => (
          <p
            key={i}
            onMouseEnter={() => setActiveIndex(i)}
            className={`cursor-pointer flex items-center border-b border-gray-300 pb-5 text-lg transition-colors duration-300 ${
              activeIndex === i ? "text-blue-600" : "text-black"
            }`}
          >
            <span className="w-10 text-avocado">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex-1">{step.text}</span>
          </p>
        ))}
        <a
          href="#"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition float-left"
        >
          Take your shot
        </a>
      </div>
    </section>
  );
}
