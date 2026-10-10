"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiClock,
  FiUsers,
  FiCreditCard,
  FiMenu,
  FiX,
  FiLayers,
  FiUserCheck,
} from "react-icons/fi";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: FiGrid,
  },
  {
    name: "Facilities",
    href: "/admin/facalites",
    icon: FiLayers,
    mainOnly: true,
  },
  {
    name: "Booking Slot",
    href: "/admin/booking-slots",
    icon: FiClock,
    mainOnly: true,
  },
  {
    name: "Bookings",
    href: "/admin/bookings",
    icon: FiUsers,
  },
  {
    name: "Membership",
    href: "/admin/membership",
    icon: FiUserCheck,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: FiCreditCard,
  },
];

export default function AdminSidebar({ adminLevel = "moderator" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleNavigation = navigation.filter(
    (item) => !item.mainOnly || adminLevel === "main"
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#07101c]/90 text-white backdrop-blur-xl lg:hidden"
      >
        <FiMenu size={20} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.07] bg-[#07101c] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/[0.07] px-6">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="group"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
              The Checkpoint
            </p>
            <h1 className="mt-1 text-lg font-black tracking-tight text-white">
              ADMIN PANEL
            </h1>
          </Link>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="text-slate-500 hover:text-white lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
            Management
          </p>

          {visibleNavigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    active
                      ? "text-white"
                      : "text-slate-600 group-hover:text-blue-400"
                  }
                />

                <span>{item.name}</span>

                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.07] p-4">
          <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs font-semibold text-white">
              {adminLevel === "main" ? "Main Administrator" : "Moderator"}
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              The Checkpoint Cinema
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}