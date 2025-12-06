import React from "react";
import ConversionSection from "@/components/frontend/home/ConversionSection";

const Footer = () => {
  return (
    <>
      <ConversionSection />

      <div className="w-full pb-20 | lg:pb-24 | 2xl:pb-32 | 4xl:pb-40">
        <div className="px-2 | sm:px-6 | xl:px-12 | 2xl:px-20 | 3xl:px-40 | 4xl:px-60">
          <div className="w-full relative px-2 | lg:px-3 | xl:px-4">
            <div className="w-full pt-10 | lg:pt-16 | 2xl:pt-24 bg-gray-600 rounded-2xl transform-gpu rounded-tl-none relative overflow-hidden | lg:rounded-3xl | dark:bg-grayDark-500">
              <div className="px-0">
                <div className="bg-white rounded-br-2xl absolute top-0 left-0 z-20 w-40 h-14 | lg:rounded-br-3xl lg:w-80 lg:h-20 | dark:bg-grayDark-600">
                  <svg
                    id="Layer_1"
                    className="w-10 h-10 | lg:w-12 lg:h-12 text-white fill-current absolute bottom-px -left-px transform translate-y-full dark:text-grayDark-600"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    x={0}
                    y={0}
                    viewBox="0 0 100 100"
                    xmlSpace="preserve"
                  >
                    <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
                  </svg>
                  <svg
                    id="Layer_1"
                    className="w-10 h-10 | lg:w-12 lg:h-12 text-white fill-current absolute -top-px right-px transform translate-x-full dark:text-grayDark-600"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    x={0}
                    y={0}
                    viewBox="0 0 100 100"
                    xmlSpace="preserve"
                  >
                    <path d="M51.9 0v1.9c-27.6 0-50 22.4-50 50H0V0h51.9z" />
                  </svg>
                </div>
                <div className="w-full flex flex-wrap mb-5 relative z-20 mt-10 | lg:mt-0 lg:-mb-16">
                  <div className="px-2 | lg:px-3 | xl:px-4 w-full">
                    <div className="flex flex-col space-y-3 | lg:space-y-5 items-center text-center">
                      <div className="inline-flex items-center space-x-2  ">
                        <div className="bg-white w-1.5 h-1.5 rounded-full" />
                        <div className="font-light text-sm | lg:text-base text-white">
                          Careers at Shape
                        </div>
                      </div>
                      <h2 className="text-2xl | md:text-3xl | xl:text-4xl | 4xl:text-5xl font-sans-primary tracking-tight text-white leading-none text-balance max-w-lg">
                        Want to join these beautiful humans?
                      </h2>
                      <div className="relative group inline-flex items-center">
                        <svg
                          width={0}
                          height={0}
                          className="absolute hidden"
                          colorInterpolationFilters="sRGB"
                        >
                          <defs>
                            <filter id="buttonFilter">
                              <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation={5}
                                result="blur"
                              />
                              <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                result="buttonFilter"
                              />
                              <feComposite
                                in="SourceGraphic"
                                in2="buttonFilter"
                                operator="atop"
                              />
                              <feBlend in="SourceGraphic" in2="buttonFilter" />
                            </filter>
                          </defs>
                        </svg>
                        <a
                          href="https://madebyshape.co.uk/careers/"
                          className="inline-flex relative group outline-none  | focus:outline-none "
                          style={{ filter: "url(#buttonFilter)" }}
                        >
                          <div className="w-auto inline-flex items-center justify-center relative leading-tight shadow-none overflow-hidden rounded-full border-default bg-primary-600 text-gray-600 py-2 px-5">
                            <div className="relative inline-flex top-px flex-shrink-0">
                              <div>View open roles</div>
                            </div>
                          </div>
                          <div className="bg-primary-600 flex-shrink-0 overflow-hidden flex items-center justify-center -ml-1 rounded-full transform transition-transform | w-9 h-9 | xl:group-hover:translate-x-3  xl:group-hover:rotate-45 | js-button-icon" />
                        </a>
                        <div className="w-9 h-9 absolute top-0 right-0 flex items-center justify-center z-20 transition-transform transform w-9 h-9 | xl:group-hover:translate-x-3  xl:group-hover:rotate-45 || js-button-arrow">
                          <div className="relative overflow-hidden text-gray-600">
                            <div className="relative top-0 left-0 transition-transform transform || js-button-arrow-icon-primary ">
                              <svg
                                className="w-3 h-3 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 384 512"
                              >
                                <path d="M328 96h24v288h-48V177.9L81 401l-17 17-33.9-34 17-17 223-223H64V96h264z" />
                              </svg>
                            </div>
                            <div className="absolute top-0 left-0 transition-transform transform translate-y-full -translate-x-full || js-button-arrow-icon-secondary ">
                              <svg
                                className="w-3 h-3 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 384 512"
                              >
                                <path d="M328 96h24v288h-48V177.9L81 401l-17 17-33.9-34 17-17 223-223H64V96h264z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="gap-4 | lg:gap-6 | xl:gap-8 grid w-screen left-1/2 -translate-x-1/2 transform relative z-10 grid-cols-3 | lg:grid-cols-5">
                  <div className=" gap-4 | lg:gap-6 | xl:gap-8 grid-cols-1 w-full transform  grid">
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-219.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143506&s=d54fdf11bdd202878467ef0658ca8bbd 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-219.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143506&s=7b54b6f3dc24574ec39589779a99c290 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-219.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143506&s=d54fdf11bdd202878467ef0658ca8bbd"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-219.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143506&s=6d396655022c9e5b9264f2755a017abc 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-219.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143506&s=6a4a82d845a48e711ffa0bde77907f02 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 219"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-216.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143500&s=c2ad95fef3f8b63482c9fc2e533839f8 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-216.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143500&s=14c342505f57e1f714b52facdce29bc1 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-216.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143500&s=c2ad95fef3f8b63482c9fc2e533839f8"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-216.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143500&s=85abb0da7aa6e103d167bcf10aa8be12 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-216.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143500&s=ad246d61452c29760a93e5b9c12b8dad 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 216"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                  </div>
                  <div className=" gap-4 | lg:gap-6 | xl:gap-8 grid-cols-1 w-full transform lg:translate-y-16 grid">
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 transform translate-y-10 | lg:translate-y-0">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-208.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143487&s=19b949fe09dfe3e0161a0a345a83f057 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-208.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143487&s=473926e06f19c0e6085e33f2ba80784a 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-208.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143487&s=19b949fe09dfe3e0161a0a345a83f057"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-208.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143487&s=3999d2aa676d2e2e3a05f639e37652ff 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-208.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143487&s=df43f2707d3d276ade74746420a58472 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 208"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 transform translate-y-10 | lg:translate-y-0">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-204.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706011711&s=65df1201d3ce02cd144324370898c0e5 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-204.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706011711&s=af9eb16d5954b98c4c1c4b8a43900833 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-204.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706011711&s=65df1201d3ce02cd144324370898c0e5"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-204.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706011711&s=abac91c8b5c69d351a2c65fab65a25a2 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-204.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706011711&s=4f017f1d1c332613ace547ff8db67808 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 204"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                  </div>
                  <div className=" gap-4 | lg:gap-6 | xl:gap-8 grid-cols-1 w-full transform lg:translate-y-32 grid">
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-194.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143471&s=0c1cdeabf0e2b18f44a8c9412fb9aed2 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-194.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143471&s=b35d4a42812427d74987b3fb51210950 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-194.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143471&s=0c1cdeabf0e2b18f44a8c9412fb9aed2"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-194.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143471&s=1d6e9d6a7f43acd6c564ccdd39b193ed 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-194.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143471&s=6c1d39fd8f8b68f2bebc1ebc54848a26 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 194"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-202.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143474&s=43b8c998b09a0bf3107434396d697245 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-202.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143474&s=c1f0fbfc5f6f309c943b989f51fa0ceb 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-202.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143474&s=43b8c998b09a0bf3107434396d697245"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-202.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143474&s=adebde2ea7276552fe3f76d3a9d55d52 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-202.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143474&s=1858570cd5ca88e5726e7d46dc84bd3b 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 202"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                  </div>
                  <div className=" gap-4 | lg:gap-6 | xl:gap-8 grid-cols-1 w-full transform lg:translate-y-16 hidden | lg:grid">
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-225.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143517&s=30e5faa3c188e8f425300947c23a10c0 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-225.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143517&s=0483682169689d5e7e2d0b84510b1287 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-225.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143517&s=30e5faa3c188e8f425300947c23a10c0"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-225.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143517&s=a06acf5f2d142099ff670c6a0e4329d1 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-225.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143517&s=41f5935806649e774342d31d6f2b2083 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 225"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-182.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143456&s=e070e1166ba1845ef70cd4636075610f 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-182.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143456&s=b0270bce8318ca8ab7f07a49426a1aee 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-182.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143456&s=e070e1166ba1845ef70cd4636075610f"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-182.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143456&s=af13c4cf68ac6752dabbe82ab74e35b2 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-182.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143456&s=3baf357ba919c05a8af63a924a2f02e6 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 182"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                  </div>
                  <div className=" gap-4 | lg:gap-6 | xl:gap-8 grid-cols-1 w-full transform  hidden | lg:grid">
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-37.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706010514&s=b94073dd6914c5bdff5ac9fa09cc3dda 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-37.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706010514&s=c1ef92e82641d6c7613ca0cda75b2d30 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-37.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706010514&s=b94073dd6914c5bdff5ac9fa09cc3dda"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-37.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706010514&s=b4ce83711863e02000419d57f1e624a2 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-37.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1706010514&s=aa0676e2b0328aaddfd925bf68808bdf 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 37"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                    <div className="w-full aspect-ratio-1/1 relative rounded-2xl transform-gpu overflow-hidden bg-gray-500 | dark:bg-grayDark-400 ">
                      <picture>
                        <source
                          type="image/webp"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-32.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143423&s=9ffeb9f9b44ab8f66814d50ddfe71737 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-32.jpg?w=600&h=600&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143423&s=ad504fd7c934a9fe84eed57a12f93982 600w"
                          sizes="100vw"
                        />
                        <img
                          src="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-32.jpg?w=400&h=400&q=80&fm=webp&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143423&s=9ffeb9f9b44ab8f66814d50ddfe71737"
                          srcSet="https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-32.jpg?w=400&h=400&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143423&s=0489943aca15eebbb33e4ed97697595f 400w, https://made-byshape.transforms.svdcdn.com/production/uploads/images/India-2022/People-in-Studio/Shape-April-2022-HR-32.jpg?w=600&h=600&q=95&auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.5&dm=1651143423&s=5c8ef545b653c016ac12f26ec86bfeac 600w"
                          sizes="100vw"
                          alt="Shape April 2022 HR 32"
                          className=" w-full   absolute top-0 left-0 w-full h-full object-cover object-center"
                          loading="lazy"
                          width={600}
                          height={600}
                        />
                      </picture>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-black overflow-hidden">
        <div className="w-full grid grid-cols-4 p-20 justify-between relative z-30">
          <div className="w-full mb-10 flex flex-wrap flex-col md:flex-row md:flex-nowrap md:mb-24 lg:items-start lg:justify-start lg:flex-col lg:flex-wrap lg:pl-0 lg:mb-0">
            <h2 className="text-xl tracking-tight text-white leading-tighter mb-5">
              Do you like <br />
              what you see?
            </h2>
            <div className="flex items-start flex-col space-y-5 md:mt-1 md:flex-row md:items-center md:space-y-0 md:space-x-5 lg:mt-0 lg:space-y-5 lg:space-x-0 lg:items-start lg:flex-col xl:w-full xl:items-center xl:flex-row xl:space-y-0 xl:space-x-8">
              <div className="relative group inline-flex items-center">
                <a
                  href="https://madebyshape.co.uk/project-planner/"
                  className="inline-flex relative group outline-none  | focus:outline-none "
                >
                  <div className="w-auto inline-flex items-center justify-center relative leading-tight shadow-none overflow-hidden rounded-full border-default bg-primary-600 text-gray-600 flex-shrink-0 py-2 px-5">
                    <div className="relative inline-flex top-px flex-shrink-0">
                      <div>Start a project</div>
                    </div>
                  </div>
                  <div className="bg-primary-600 flex-shrink-0 overflow-hidden flex items-center justify-center -ml-1 rounded-full transform transition-transform | w-9 h-9 | xl:group-hover:translate-x-3  xl:group-hover:rotate-45 | js-button-icon" />
                </a>
                <div className="w-9 h-9 absolute top-0 right-0 flex items-center justify-center z-20 transition-transform transform w-9 h-9 | xl:group-hover:translate-x-3  xl:group-hover:rotate-45 || js-button-arrow">
                  <div className="relative overflow-hidden text-gray-600">
                    <div className="relative top-0 left-0 transition-transform transform || js-button-arrow-icon-primary ">
                      <svg
                        className="w-3 h-3 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 384 512"
                      >
                        <path d="M328 96h24v288h-48V177.9L81 401l-17 17-33.9-34 17-17 223-223H64V96h264z" />
                      </svg>
                    </div>
                    <div className="absolute top-0 left-0 transition-transform transform translate-y-full -translate-x-full || js-button-arrow-icon-secondary ">
                      <svg
                        className="w-3 h-3 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 384 512"
                      >
                        <path d="M328 96h24v288h-48V177.9L81 401l-17 17-33.9-34 17-17 223-223H64V96h264z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-1 mt-10">
              <a
                href="https://www.linkedin.com/company/madebyshape/mycompany/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 text-gray-600 translate-z-0 rounded-full w-8 h-8 duration-400 | xl:hover:bg-gray-600 xl:hover:text-white | lg:dark:hover:bg-grayDark-400"
              >
                <div className="sr-only">MadeByShape</div>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/madebyshape"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 text-gray-600 translate-z-0 rounded-full w-8 h-8 duration-400 | xl:hover:bg-gray-600 xl:hover:text-white | lg:dark:hover:bg-grayDark-400"
              >
                <div className="sr-only">MadeByShape</div>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8l164.9-188.5L26.8 48h145.6l100.5 132.9L389.2 48zm-24.8 373.8h39.1L151.1 88h-42l255.3 333.8z" />
                </svg>
              </a>
              <a
                href="https://github.com/madebyshape/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 text-gray-600 translate-z-0 rounded-full w-8 h-8 duration-400 | xl:hover:bg-gray-600 xl:hover:text-white | lg:dark:hover:bg-grayDark-400"
              >
                <div className="sr-only">MadeByShape</div>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 496 512"
                >
                  <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/madebyshape"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 text-gray-600 translate-z-0 rounded-full w-8 h-8 duration-400 | xl:hover:bg-gray-600 xl:hover:text-white | lg:dark:hover:bg-grayDark-400"
              >
                <div className="sr-only">MadeByShape</div>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>
              </a>
              <a
                href="https://www.behance.net/madebyshape"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center bg-primary-600 text-gray-600 translate-z-0 rounded-full w-8 h-8 duration-400 | xl:hover:bg-gray-600 xl:hover:text-white | lg:dark:hover:bg-grayDark-400"
              >
                <div className="sr-only">MadeByShape</div>
                <svg
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                >
                  <path d="M232 237.2c31.8-15.2 48.4-38.2 48.4-74 0-70.6-52.6-87.8-113.3-87.8H0v354.4h171.8c64.4 0 124.9-30.9 124.9-102.9 0-44.5-21.1-77.4-64.7-89.7zM77.9 135.9H151c28.1 0 53.4 7.9 53.4 40.5 0 30.1-19.7 42.2-47.5 42.2h-79v-82.7zm83.3 233.7H77.9V272h84.9c34.3 0 56 14.3 56 50.6 0 35.8-25.9 47-57.6 47zm358.5-240.7H376V94h143.7v34.9zM576 305.2c0-75.9-44.4-139.2-124.9-139.2-78.2 0-131.3 58.8-131.3 135.8 0 79.9 50.3 134.7 131.3 134.7 61.3 0 101-27.6 120.1-86.3H509c-6.7 21.9-34.3 33.5-55.7 33.5-41.3 0-63-24.2-63-65.3h185.1c.3-4.2.6-8.7.6-13.2zM390.4 274c2.3-33.7 24.7-54.8 58.5-54.8 35.4 0 53.2 20.8 56.2 54.8H390.4z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              Learn
            </div>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/about/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  About
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/culture/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Culture
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/testimonials/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Testimonials
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/processes/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Processes
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/frequently-asked-questions/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  FAQs
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/branding-faqs/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Branding FAQs
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/web-design-blog/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div className="relative z-20">
            <div className="text-gray-200 font-light mb-3 text-sm | md:text-base | dark:text-gray-100">
              Explore
            </div>
            <ul className="space-y-1">
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Home
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/work/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Work
                </a>
                <div className="-mt-0.5 uppercase pointer-events-none rounded-full z-20 bg-primary-600 text-gray-600 text-xs pt-0.5 pb-px px-2 leading-tighter tracking-tight">
                  New
                </div>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/services/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Services
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/careers/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Careers
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/sectors/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Sectors
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/hex-test/"
                  target="_blank"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Hex Test
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <a
                  href="https://madebyshape.co.uk/contact/"
                  className="text-white relative link text-sm | md:text-base |  | dark:text-gray-200 lg:dark:hover:text-gray-100 || group"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div className="w-full max-w-xs transform">
            <div className="flex flex-col items-start">
              <div className="text-gray-200 font-light mb-3 text-sm">
                Get in touch
              </div>
              <a
                href="tel:01942894596"
                target="_blank"
                className="inline-flex items-center space-x-4 mb-1 text-white text-sm | lg:text-base | lg:dark:hover:text-grayDark-100 | dark:text-grayDark-200"
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
                <div className="link text-sm | md:text-base">01942 894 596</div>
              </a>
              <a
                href="mailto:hello@madebyshape.co.uk"
                target="_blank"
                className="inline-flex items-center space-x-4 text-white | lg:dark:hover:text-grayDark-100 | dark:text-grayDark-200"
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
                  hello@madebyshape.co.uk
                </div>
              </a>
              <div className="flex space-x-4 mt-6 mb-1 | lg:mb-2">
                <svg
                  className="w-3 h-3 fill-current text-white mt-1 | dark:text-grayDark-200 4xl:w-3.5 4xl:h-3.5"
                  width={12}
                  height={16}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                >
                  <path d="M192 512s192-208 192-320C384 86 298 0 192 0S0 86 0 192c0 112 192 320 192 320zm0-384a64 64 0 110 128 64 64 0 110-128z" />
                </svg>
                <div className="w-full relative ">
                  <p className="text-sm | md:text-base text-white dark:text-grayDark-200 font-sans-primary relative z-10 text-pretty font-light leading-7  mb-6">
                    MadeByShape
                    <br />1 Gibfield Park Avenue
                    <br />
                    Atherton Manchester
                    <br />
                    M46 0SU
                  </p>
                </div>
              </div>
              <a
                href="https://what3words.com/topped.little.pirate"
                target="_blank"
                className="inline-flex items-center space-x-4 text-white | lg:dark:hover:text-grayDark-100 | dark:text-grayDark-200"
              >
                <svg
                  className="w-3 h-3 fill-current | 4xl:w-3.5 4xl:h-3.5"
                  viewBox="0 0 11 11"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.998 5.5c0 .952.005 1.903-.002 2.854-.005.614-.119 1.2-.51 1.7-.4.512-.924.81-1.564.891a6.95 6.95 0 01-.857.051c-1.8.005-3.599.006-5.398 0-.495-.002-.984-.068-1.425-.318C.564 10.295.167 9.713.055 8.944a5.315 5.315 0 01-.052-.753C0 6.348 0 4.506.003 2.664c0-.532.08-1.05.369-1.513C.762.524 1.33.159 2.057.057a6.29 6.29 0 01.857-.053 930.1 930.1 0 015.424 0c.504.002 1 .072 1.447.332a2.278 2.278 0 011.16 1.725c.036.253.048.51.05.767.006.89.003 1.782.003 2.673zm-2.33-2.029c-.007-.178-.073-.295-.21-.369-.229-.123-.483-.015-.572.248-.24.71-.477 1.42-.715 2.13l-.635 1.898c-.084.251.01.465.234.545.226.081.437-.042.527-.31L8.632 3.62c.02-.056.028-.115.037-.15zm-2.48-.416c-.183 0-.32.102-.387.297l-.547 1.63-.802 2.397c-.074.22-.01.41.167.513.23.134.492.021.587-.258.216-.64.429-1.281.643-1.922.236-.706.473-1.41.707-2.117.093-.278-.088-.539-.368-.54zM2.332 7.528c.01.181.081.3.223.373.224.115.473.003.56-.254.177-.519.35-1.039.523-1.558l.827-2.469c.086-.256-.024-.49-.258-.554-.213-.059-.416.06-.496.296-.45 1.342-.898 2.684-1.346 4.026-.018.052-.025.107-.033.14z" />
                </svg>
                <div className="link text-sm | md:text-base"></div>
              </a>
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
            <div className="inline-flex flex-row text-gray-200 w-auto text-1xs | md:text-xs | lg:text-sm | dark:text-grayDark-200">
              <div>© Made By LHRWEB Ltd 2025</div>
              {/* <div className="mx-2 | lg:mx-5">|</div>
              <div>Company Reg Number 10529058</div> */}
            </div>
          </div>
          <div className="inline-flex flex-row text-gray-200 w-auto text-1xs | md:text-xs | lg:text-sm | dark:text-grayDark-200">
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
