
"use client";

import Image from "next/image";
import { useState } from "react";
import { FiX, FiMaximize2 } from "react-icons/fi";
import { gallerySections } from "@/generated/gallery-data";

function optimizeCloudinaryUrl(url, width) {
  if (!url || !url.includes("/upload/")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto:eco,w_${width}/`
  );
}

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <section
        id="gallery"
        className="bg-[#030712] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-blue-400">
              Explore The Checkpoint
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              See What Awaits You
            </h2>
          </header>

          {/* Gallery */}
          <div className="space-y-16">
            {gallerySections.map((section) => (
              <div key={section.folder}>
                <h3 className="mb-8 text-xl font-semibold text-white sm:text-2xl">
                  {section.title}
                </h3>

                <div className="space-y-12">
                  {section.routes.map((route) => (
                    <div key={route.folder}>
                      <h4 className="mb-5 text-lg font-medium text-gray-200 sm:text-xl">
                        {route.folder
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                      </h4>

                      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                        {route.images.map((image, index) => {
                          const thumbnailSrc = optimizeCloudinaryUrl(
                            image,
                            600
                          );

                          const fullSrc = optimizeCloudinaryUrl(
                            image,
                            1600
                          );

                          return (
                            <button
                              key={image}
                              type="button"
                              onClick={() =>
                                setSelectedImage({
                                  src: fullSrc,
                                  title: route.folder,
                                })
                              }
                              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-[#080f1c] sm:rounded-xl"
                            >
                              <Image
                                src={thumbnailSrc}
                                alt={`${route.folder} ${index + 1}`}
                                fill
                                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 400px"
                                loading="lazy"
                                className="object-cover"
                              />

                              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />

                              <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                <FiMaximize2
                                  size={13}
                                  className="text-white"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-3 sm:p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white transition-colors hover:bg-white/10 sm:right-4 sm:top-4"
          >
            <FiX size={22} />
          </button>

          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#080f1c]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.title}
              width={1600}
              height={1200}
              sizes="94vw"
              quality={75}
              priority
              className="max-h-[90vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
