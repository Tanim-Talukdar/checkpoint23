"use client";

import Image from "next/image";
import { useState } from "react";
import {
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiFilm,
  FiActivity,
  FiMonitor,
  FiCoffee,
  FiGrid
} from "react-icons/fi";

const links = [
  {
    name: "Gaming",
    href: "/#gaming",
    icon: FiMonitor,
  },
  {
    name: "Fitness",
    href: "/#packages",
    icon: FiActivity,
  },
  {
    name: "Restaurant",
    href: "/#restaurant",
    icon: FiCoffee,
  },
  {
    name: "gallery",
    href: "/#gallery",
    icon:  FiGrid,
  },
  {
    name: "contact",
    href: "/#contact",
    icon:  FiGrid,
  },
  {
    name: "Movie",
    href: "/movie",
    icon: FiFilm,
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6 animate-navbar-in">
      <nav className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#07101c]/80 shadow-2xl backdrop-blur-xl">
        {/* MAIN BAR */}
        <div className="flex h-[68px] items-center justify-between px-5 sm:px-7">

          {/* LOGO */}
          <a
            href="/"
            onClick={handleNavClick}
            className="group flex shrink-0 items-center gap-3"
            aria-label="The Checkpoint Home"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg shadow-lg shadow-blue-600/10 transition-transform duration-200 group-hover:scale-[1.08] group-hover:-rotate-1 active:scale-[0.94]">
              <Image
                src="/logo.webp"
                alt="The Checkpoint Logo"
                width={40}
                height={40}
                priority
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="leading-none">
              <span className="block text-[15px] font-black tracking-[0.08em] text-white">
                THE CHECKPOINT
              </span>

              <span className="mt-1 block text-[7px] font-medium tracking-[0.3em] text-slate-500">
                GAMING · DINING · FITNESS
              </span>
            </div>
          </a>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-1 xl:flex">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className="group relative flex items-center rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-slate-400 transition duration-200 hover:text-white"
                >
                  <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-white/5 opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100" />

                  <Icon
                    size={13}
                    className="mr-1.5 text-blue-400 transition group-hover:text-blue-300"
                  />

                  {link.name}

                  <span className="absolute bottom-1.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-blue-500 opacity-0 transition-all duration-300 group-hover:w-4 group-hover:opacity-100" />
                </a>
              );
            })}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.06] active:scale-[0.88] xl:hidden"
            aria-label={
              open
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={open}
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`overflow-hidden border-t px-5 transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] xl:hidden ${
            open
              ? "max-h-[400px] border-white/10 pb-5 pt-3 opacity-100"
              : "max-h-0 border-t-transparent pb-0 pt-0 opacity-0"
          }`}
        >
          <div className="flex flex-col">
            {links.map((link, index) => {
              const Icon = link.icon;

              return (
                <div
                  key={link.name}
                  className={open ? "animate-mobile-menu-item" : ""}
                  style={{
                    animationDelay: `${index * 40}ms`,
                  }}
                >
                  <a
                    href={link.href}
                    onClick={handleNavClick}
                    className="group flex items-center rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon
                      size={15}
                      className="mr-3 text-blue-400"
                    />

                    {link.name}

                    <FiArrowUpRight
                      size={14}
                      className="ml-auto text-white/20 transition group-hover:text-blue-400"
                    />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}