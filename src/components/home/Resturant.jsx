
"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import { resturant } from "@/generated/gallery-data";

export default function Restaurant() {
  const [selectedMenu, setSelectedMenu] = useState(null);

  const menuImages = resturant?.images ?? [];

  return (
    <section
      id="restaurant"
      className="relative overflow-hidden bg-[#030712] text-white"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-40 top-20 hidden h-[450px] w-[450px] rounded-full bg-blue-600/[0.08] blur-[140px] sm:block" />
      <div className="pointer-events-none absolute -left-40 bottom-20 hidden h-[400px] w-[400px] rounded-full bg-cyan-500/[0.04] blur-[120px] sm:block" />

      <div className="h-px bg-blue-500/25" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        {/* Header */}
        <div className="mb-12 flex items-center gap-3 sm:mb-16">
          <span className="h-px w-8 bg-blue-500" />

          <span className="text-xl font-black uppercase tracking-[0.2em] text-blue-400 sm:text-2xl">
            The Checkpoint Restaurant
          </span>
        </div>

        {/* Menus */}
        <div className="grid gap-4 sm:grid-cols-2">
          {menuImages.map((image, index) => {
            const title =
              index === 0
                ? "FOOD MENU"
                : index === 1
                  ? "DRINKS MENU"
                  : `MENU ${index + 1}`;

            return (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedMenu({ src: image, title })}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#07101D] text-left"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={image}
                    alt={`${title} - The Checkpoint Bashundhara`}
                    fill
                    sizes="(max-width: 639px) 100vw, 50vw"
                    quality={70}
                    loading="lazy"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition sm:group-hover:border-blue-400 sm:group-hover:bg-blue-600">
                    <FiArrowUpRight size={17} />
                  </div>

                  <div className="absolute bottom-0 left-0 p-5 sm:p-7">
                    <p className="text-[8px] font-bold tracking-[0.3em] text-blue-300">
                      THE CHECKPOINT
                    </p>

                    <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                      {title}
                    </h3>

                    <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50">
                      Tap to view
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedMenu && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-4"
          onClick={() => setSelectedMenu(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMenu(null)}
            aria-label="Close menu"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white transition hover:bg-blue-600 sm:right-4 sm:top-4"
          >
            <FiX size={20} />
          </button>

          <div
            className="relative flex max-h-[94dvh] w-full max-w-5xl items-center justify-center overflow-auto rounded-xl border border-white/10 bg-[#030712]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedMenu.src}
              alt={selectedMenu.title}
              width={1024}
              height={1280}
              sizes="94vw"
              quality={75}
              priority
              className="block h-auto max-h-[94dvh] w-auto max-w-full object-contain"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "94dvh",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

