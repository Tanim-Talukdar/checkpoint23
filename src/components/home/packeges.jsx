
"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";

export default function Packages() {
  const [showPackage, setShowPackage] = useState(false);

  return (
    <section id="packages" className="bg-[#030712] text-white">
      <div className="h-px bg-blue-500/25" />

      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        {/* TITLE */}
        <div className="mb-12 flex items-center gap-3 sm:mb-16">
          <span className="h-px w-8 bg-blue-500" />
          <span className="text-xl font-black uppercase tracking-[0.2em] text-blue-400 sm:text-2xl">
            The Checkpoint Fitness
          </span>
        </div>

        {/* PACKAGE IMAGE */}
        <button
          type="button"
          onClick={() => setShowPackage(true)}
          className="group relative mx-auto block max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#07101D] shadow-2xl"
        >
          <Image
            src="https://res.cloudinary.com/qds5td8c/image/upload/v1790704843/the-checkpoint/packeges.webp"
            alt="The Checkpoint fitness packages and membership pricing"
            width={1066}
            height={1419}
            sizes="(max-width: 768px) 100vw, 900px"
            loading="lazy"
            className="mx-auto block max-h-[75vh] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.015]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/70 to-transparent" />

          <div className="absolute bottom-0 left-0 p-5 text-left sm:p-7 lg:p-8">
            <p className="text-[8px] font-bold tracking-[0.3em] text-blue-300">
              THE CHECKPOINT
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              FITNESS PACKAGES
            </h3>

            <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50">
              Tap to view full packages
            </p>
          </div>

          <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition duration-300 group-hover:border-blue-400 group-hover:bg-blue-600">
            <FiArrowUpRight size={18} />
          </div>
        </button>
      </div>

      {/* MODAL */}
      {showPackage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-md sm:p-6"
          onClick={() => setShowPackage(false)}
        >
          <button
            type="button"
            onClick={() => setShowPackage(false)}
            aria-label="Close package"
            className="absolute right-4 top-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur-md transition hover:bg-blue-600"
          >
            <FiX size={20} />
          </button>

          <div
            className="max-h-[82vh] max-w-[90vw] overflow-auto rounded-2xl border border-white/10 bg-[#07101D] shadow-2xl sm:max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src="/packeges.webp"
              alt="The Checkpoint fitness packages"
              width={1066}
              height={1419}
              sizes="(max-width: 768px) 90vw, 896px"
              className="block max-h-[82vh] max-w-[90vw] object-contain sm:max-w-4xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
