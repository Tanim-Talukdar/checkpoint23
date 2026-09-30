
"use client";

import { gaming } from "@/generated/gallery-data";
import Image from "next/image";
import { useState } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";

const menuImages = [
  {
    src: gaming.images.find((image) =>
      image.includes("/pricelist.webp")
    ),
    alt: "The Checkpoint gaming prices and session rates in Bashundhara Dhaka",
    label: "GAME PRICING",
  },
  {
    src: gaming.images.find((image) => image.includes("/ps5.webp")),
    alt: "The Checkpoint PS5 games list",
    label: "PS5 GAME LIST",
  },
  {
    src: gaming.images.find((image) =>
      image.includes("/othergaming.webp")
    ),
    alt: "The Checkpoint other gaming games list",
    label: "OTHER GAMES",
  },
];

export default function Gaming() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <section
      id="gaming"
      aria-labelledby="gaming-title"
      className="relative overflow-hidden bg-[#030712] text-white"
    >
      <div className="h-px bg-blue-500/25" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        {/* HEADER */}
        <div className="mt-12 flex items-end justify-between sm:mt-16">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-400">
              Gaming Menu
            </p>

            <h2
              id="gaming-title"
              className="mt-1 text-2xl font-black tracking-tight sm:text-3xl"
            >
              Games & Pricing
            </h2>
          </div>

          <span className="hidden text-[9px] uppercase tracking-[0.2em] text-white/30 sm:block">
            Tap to view
          </span>
        </div>

        {/* GAMING MENU */}
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {menuImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setSelectedImage(image)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#07101D] text-left focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              aria-label={`View ${image.label}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#07101D]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc(50vw - 28px), 400px"
                  quality={70}
                  className="h-full w-full object-cover"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />

                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white">
                  <FiArrowUpRight size={17} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-[8px] font-bold tracking-[0.3em] text-blue-300">
                    THE CHECKPOINT
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                    {image.label}
                  </h3>

                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45">
                    Tap to view
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          {/* CLOSE */}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="Close gaming menu"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white hover:bg-blue-600"
          >
            <FiX size={20} />
          </button>

          {/* IMAGE CONTAINER */}
          <div
            className="relative flex max-h-[94dvh] max-w-6xl items-center justify-center overflow-auto rounded-xl border border-white/10 bg-[#07101D]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              width={1055}
              height={1491}
              sizes="94vw"
              quality={75}
              priority
              className="block h-auto w-auto max-h-[94dvh] max-w-[94vw] object-contain"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "94vw",
                maxHeight: "94dvh",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
