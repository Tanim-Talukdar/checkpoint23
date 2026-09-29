"use client";

import dynamic from "next/dynamic";
import {
  FiArrowUpRight,
  FiInstagram,
  FiFacebook,
  FiMapPin,
  FiPhone,
  FiNavigation,
} from "react-icons/fi";
import Image from "next/image";

const LocationMap = dynamic(() => import("../LocationMap"), {
  ssr: false,
});

const navigation = [
  { name: "Home", href: "#home" },
  { name: "Gaming", href: "#gaming" },
  { name: "Restaurant", href: "#restaurant" },
  { name: "Fitness", href: "#fitness" },
  { name: "Movies", href: "/movie" },
];

const mapUrl = "https://maps.app.goo.gl/NV7X1epSC8Ry3wXC6";
const phoneUrl = "tel:+8801844240483";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-white/[0.08] bg-[#050A14] text-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#09111F] shadow-2xl shadow-black/20">
          <div className="grid lg:grid-cols-[1.05fr_1fr]">
            <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px w-8 bg-blue-500" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">
                    Visit Us
                  </span>
                </div>

                <h3 className="max-w-md text-3xl font-black tracking-tight sm:text-4xl">
                  COME FIND
                  <span className="text-blue-500"> THE CHECKPOINT.</span>
                </h3>

                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                  Your gaming, dining and fitness destination in
                  Bashundhara R/A, Dhaka.
                </p>
              </div>

              {/* ADDRESS */}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition duration-300 hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <FiMapPin size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                      Our Location
                    </p>

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                      Bashundhara R/A, Block C, Road 2,
                      House 1/F, Dhaka, Bangladesh 1229
                    </p>

                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 transition group-hover:text-blue-400">
                      Open in Google Maps
                      <FiArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              </a>

              {/* PHONE */}
              <a
                href={phoneUrl}
                className="group mt-3 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition duration-300 hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                    <FiPhone size={20} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                      Call Us
                    </p>

                    <p className="mt-1 text-base font-bold text-white sm:text-lg">
                      +880 1844-240483
                    </p>
                  </div>
                </div>

                <FiArrowUpRight
                  size={19}
                  className="text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-500"
                />
              </a>

              {/* SOCIAL LINKS */}
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">
                    Follow The Checkpoint
                  </p>

                  <span className="ml-4 h-px flex-1 bg-white/[0.06]" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <SocialButton
                    href="https://www.instagram.com/checkpoint_bd"
                    label="The Checkpoint on Instagram"
                    icon={<FiInstagram size={23} />}
                    name="Instagram"
                  />

                  <SocialButton
                    href="https://www.facebook.com/profile.php?id=61591601052508"
                    label="The Checkpoint on Facebook"
                    icon={<FiFacebook size={23} />}
                    name="Facebook"
                  />

                  {/* TikTok - no Font Awesome dependency */}
                  <SocialButton
                    href="https://www.tiktok.com/@checkpointbd"
                    label="The Checkpoint on TikTok"
                    icon={
                      <span className="text-[21px] font-black leading-none">
                        ♪
                      </span>
                    }
                    name="TikTok"
                  />
                </div>
              </div>
            </div>

            {/* MAP */}
            <div className="relative min-h-[360px] border-t border-white/[0.08] lg:min-h-full lg:border-l lg:border-t-0">
              <div className="absolute inset-0">
                <LocationMap />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050A14]/80 via-transparent to-[#050A14]/10" />

              <div className="absolute bottom-6 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#050A14]/90 p-4 shadow-xl backdrop-blur-md sm:left-6 sm:right-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <FiNavigation size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">
                      The Checkpoint
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Bashundhara R/A, Dhaka
                    </p>
                  </div>
                </div>

                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get directions"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-blue-600"
                >
                  <FiArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY FOOTER */}
        <div className="mt-14 grid gap-12 border-t border-white/[0.07] pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.7fr]">
          {/* BRAND */}
          <div>
            <a href="#home" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg shadow-lg shadow-blue-600/10 transition-transform duration-200 hover:scale-[1.08] hover:-rotate-1 active:scale-[0.94]">
                  <Image
                    src="/logo.webp"
                    alt="The Checkpoint Logo"
                    width={40}
                    height={40}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black tracking-[0.08em]">
                  THE CHECKPOINT
                </h3>

                <p className="mt-1 text-[8px] tracking-[0.3em] text-slate-600">
                  GAMING · DINING · FITNESS
                </p>
              </div>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
              A premium destination for gaming, dining and
              fitness in Bashundhara R/A, Dhaka.
            </p>
          </div>

          {/* NAVIGATION */}
          <nav aria-label="Main navigation">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em]">
              Navigation
            </h4>

            <ul className="mt-5 space-y-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-600 transition hover:text-white"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} The Checkpoint. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a
              href="#privacy"
              className="text-xs text-slate-700 transition hover:text-slate-400"
            >
              Privacy Policy
            </a>

            <a
              href="#terms"
              className="text-xs text-slate-700 transition hover:text-slate-400"
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialButton({ href, icon, name, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group flex min-h-[52px] items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20"
    >
      <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>

      <span className="text-xs font-semibold">{name}</span>
    </a>
  );
}