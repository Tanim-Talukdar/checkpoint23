"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMonitor,
  FiUsers,
  FiGrid,
  FiCheckCircle,
} from "react-icons/fi";

import SeatLayout from "@/components/admin/SeatLayout";

export default function HallPage() {
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHall();
  }, []);

  const fetchHall = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/hall", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load hall"
        );
      }

      setHall(data.hall);
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Failed to load hall"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A14] text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-500">
            Loading cinema hall...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050A14] px-5 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">
            {error}
          </p>

          <button
            onClick={fetchHall}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* HEADER */}

      <div className="border-b border-white/[0.07] bg-[#07101c]/60">
        <div className="px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <FiArrowLeft />
            </Link>

            <div>
              <div className="mb-1 text-xs text-slate-500">
                Administration / Cinema
              </div>

              <h1 className="text-2xl font-semibold">
                Cinema Hall
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                View your cinema hall and seat layout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          {/* HALL INFO */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={<FiMonitor />}
              label="Hall"
              value={hall?.name || "Hall 1"}
            />

            <InfoCard
              icon={<FiUsers />}
              label="Capacity"
              value={`${hall?.capacity || 50} Seats`}
            />

            <InfoCard
              icon={<FiGrid />}
              label="Rows"
              value={`${hall?.rows || 5} Rows`}
            />

            <InfoCard
              icon={<FiCheckCircle />}
              label="Seats / Row"
              value={`${hall?.seatsPerRow || 10}`}
            />
          </div>

          {/* SEAT MAP */}

          <div className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5 sm:p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold">
                Seat Layout
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                50 seats · 5 rows × 10 seats
              </p>
            </div>

            <SeatLayout
              seats={hall?.seats || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>

        <div>
          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-sm font-medium text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}