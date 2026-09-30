"use client";

import Image from "next/image";
import { useState } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";

const PACKAGE_IMAGE =
  "https://res.cloudinary.com/qds5td8c/image/upload/f_auto,q_auto,w_1066/the-checkpoint/packeges.webp";

export default function Packages() {
  const [showPackage, setShowPackage] = useState(false);

  return (
    <section id="packages" className="bg-[#030712] text-white">
      <div className="h-px bg-blue-500/25" />

      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mb-12 flex items-center gap-3 sm:mb-16">
          <span className="h-px w-8 bg-blue-500" />
          <span className="text-xl font-black uppercase tracking-[0.2em] text-blue-400 sm:text-2xl">
            The Checkpoint Fitness
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPackage(true)}
          className="group relative mx-auto block max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#07101D] shadow-2xl"
        >
          <Image
            src={PACKAGE_IMAGE}
            alt="The Checkpoint fitness packages and membership pricing"
            width={1066}
            height={1419}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px"
            quality={75}
            loading="lazy"
            className="mx-auto block max-h-[75vh] w-auto max-w-full object-contain sm:transition-transform sm:duration-500 sm:group-hover:scale-[1.015]"
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

          <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition sm:group-hover:border-blue-400 sm:group-hover:bg-blue-600">
            <FiArrowUpRight size={18} />
          </div>
        </button>
      </div>

      {showPackage && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setShowPackage(false)}
        >
          <button
            type="button"
            onClick={() => setShowPackage(false)}
            aria-label="Close package"
            className="absolute right-4 top-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white transition hover:bg-blue-600"
          >
            <FiX size={20} />
          </button>

          <div
            className="max-h-[82vh] max-w-[90vw] overflow-auto rounded-2xl border border-white/10 bg-[#07101D] shadow-2xl sm:max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={PACKAGE_IMAGE}
              alt="The Checkpoint fitness packages"
              width={1066}
              height={1419}
              sizes="90vw"
              quality={80}
              className="block h-auto max-h-[82vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}