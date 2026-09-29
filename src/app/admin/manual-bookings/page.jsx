"use client";

import { useEffect, useRef, useState } from "react";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiFilm,
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiLoader,
} from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function ManualBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);

  const fetchBookings = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const currentCount = loadMore ? bookings.length : 0;

      const params = new URLSearchParams({
        limit: "10",
        skip: String(currentCount),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(
        `/api/manual-bookings?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to load manual bookings"
        );
      }

      const newBookings = Array.isArray(data.bookings)
        ? data.bookings
        : [];

      if (loadMore) {
        setBookings((prev) => [...prev, ...newBookings]);
      } else {
        setBookings(newBookings);
      }

      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error(
        "Failed to load manual bookings:",
        error
      );

      if (!loadMore) {
        setBookings([]);
      }

      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /*
    Initial load
  */
  useEffect(() => {
    fetchBookings(false);
  }, []);

  /*
    Search
    Reload the list when search changes.
  */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /*
    Lazy loading
  */
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchBookings(true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const target = observerRef.current;

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }

      observer.disconnect();
    };
  }, [
    hasMore,
    loading,
    loadingMore,
    bookings.length,
    search,
  ]);

  const filteredBookings = bookings;

  const seatBookings = bookings.filter(
    (booking) => booking.bookingType === "seat"
  );

  const fullHallBookings = bookings.filter(
    (booking) => booking.bookingType === "full-hall"
  );

  return (
    <div className="min-h-screen bg-[#050A14] px-6 py-8 text-white lg:px-10 lg:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Manual Bookings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage bookings created manually by admin
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fetchBookings(false)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/manual-bookings/add")
            }
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <FiPlus size={17} />
            Add Booking
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FiUsers />}
          label="Total Manual Bookings"
          value={bookings.length}
        />

        <StatCard
          icon={<FiCreditCard />}
          label="Cash Bookings"
          value={bookings.length}
        />

        <StatCard
          icon={<FiUsers />}
          label="Seat Bookings"
          value={seatBookings.length}
        />

        <StatCard
          icon={<FiFilm />}
          label="Full Hall Bookings"
          value={fullHallBookings.length}
        />
      </div>

      {/* Search */}
      <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#07101c]/70 p-4">
        <div className="relative">
          <FiSearch
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ID, movie, customer or phone..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
          />
        </div>
      </div>

      {/* Booking List */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#07101c]/70">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-medium">Booking Records</h2>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            onAdd={() =>
              router.push("/admin/manual-bookings/add")
            }
          />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredBookings.map((booking) => (
              <BookingRow
                key={booking._id}
                booking={booking}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lazy loading sentinel */}
      {hasMore && (
        <div
          ref={observerRef}
          className="flex min-h-20 items-center justify-center py-8"
        >
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiLoader
                size={16}
                className="animate-spin"
              />
              Loading more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#07101c]/70 p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function BookingRow({ booking }) {
  const isFullHall =
    booking.bookingType === "full-hall";

  const movieName =
  booking.movieTitle ||
  booking.movieName ||
  booking.manualMovieName ||
  booking.movieSnapshot?.title ||
  "Movie Name";

  const displayTime =
    booking.startTime ||
    booking.time ||
    booking.showtimeSnapshot?.startTime ||
    "Time";

  return (
    <div className="p-5 transition hover:bg-white/[0.02]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* Movie / Date */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <FiFilm className="shrink-0 text-blue-400" />

            <h3 className="truncate font-medium text-white">
              {movieName}
            </h3>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiCalendar />
              {booking.date || "Date"}
            </span>

            <span className="flex items-center gap-1.5">
              <FiClock />
              {displayTime}
            </span>

            <span>Hall 1</span>
          </div>
        </div>

        {/* Type */}
        <div>
          <span
            className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-medium ${
              isFullHall
                ? "bg-purple-500/10 text-purple-400"
                : "bg-blue-500/10 text-blue-400"
            }`}
          >
            {isFullHall
              ? "Full Hall"
              : "Seat Booking"}
          </span>

          {isFullHall ? (
            <p className="mt-2 text-xs text-slate-500">
              All 50 seats
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Seats:{" "}
              <span className="text-slate-300">
                {booking.seats?.join(", ") || "—"}
              </span>
            </p>
          )}
        </div>

        {/* Customer */}
        <div className="min-w-[180px]">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <FiUser className="text-slate-500" />
            {booking.customerName || "Customer"}
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <FiPhone />
            {booking.phone || "—"}
          </div>
        </div>

        {/* Amount */}
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5 text-sm font-medium text-white">
            <FiDollarSign className="text-blue-400" />
            ৳
            {booking.totalAmount ??
              booking.amount ??
              "—"}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <FiCreditCard />
            Cash
          </div>
        </div>

        {/* Status */}
        <div>
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              booking.bookingStatus === "cancelled"
                ? "bg-red-500/10 text-red-400"
                : booking.bookingStatus === "pending"
                ? "bg-yellow-500/10 text-yellow-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {booking.bookingStatus || "Confirmed"}
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="divide-y divide-white/[0.06]">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse p-5"
        >
          <div className="h-4 w-48 rounded bg-white/5" />

          <div className="mt-3 h-3 w-72 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
        <FiFilm size={24} />
      </div>

      <h3 className="font-medium text-white">
        No manual bookings
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Create your first manual booking.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600"
      >
        Add Booking
      </button>
    </div>
  );
}