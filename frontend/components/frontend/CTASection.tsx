import React from "react";

const CTASection = () => {
    return (
        <div className="w-full bg-white px-6 py-20 lg:px-20 xl:px-24">
            <div className="w-full mb-10 flex flex-col md:mb-24 lg:mb-0">
                <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tighter text-black font-bold mb-8">
                    Let’s work together.
                </h2>
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8 text-black">
                    <p className="text-xl md:text-2xl text-gray-300 font-light">
                        Ready to accelerate your brand?
                    </p>

                    <div className="flex items-center flex-wrap gap-4">
                        <a
                            href="/project-inquiry"
                            target="_self"
                            className="group inline-flex items-center justify-center bg-transparent border border-black/30 rounded-full px-8 py-3 text-lg transition-all duration-300 hover:bg-black hover:text-white"
                        >
                            <span className="mr-2">Get Started</span>
                            <div className="relative w-6 h-6 overflow-hidden">
                                <svg
                                    className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </a>

                        <span className="text-xl text-gray-400">or</span>

                        <a
                            href="/contact"
                            target="_self"
                            className="group inline-flex items-center justify-center bg-transparent border border-black/30 rounded-full px-8 py-3 text-lg transition-all duration-300 hover:bg-black hover:text-white"
                        >
                            <span className="mr-2">Book a Call</span>
                            <div className="relative w-6 h-6 overflow-hidden">
                                <svg
                                    className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CTASection;
