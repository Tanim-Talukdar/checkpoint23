"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX,
} from "react-icons/fi";

const FACILITIES = [
  "All Facilities",
  "Gym",
  "Swimming Pool",
  "Gym + Pool",
  "Steam Bath",
  "Playground",
  "Private Movie",
];

const STATUSES = [
  "All Statuses",
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const PAYMENT_STATUSES = [
  "All Payments",
  "Unpaid",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

const AUTO_REFRESH_MS = 10000;
const BOOKINGS_PER_PAGE = 100;

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateInput(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  if (!time || time === "Anytime") {
    return time || "—";
  }

  const match = time.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return time;
  }

  const hour = Number(match[1]);
  const minute = match[2];

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime) {
    return "Anytime";
  }

  if (!endTime) {
    return formatTime(startTime);
  }

  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

function formatDuration(minutes) {
  if (!minutes || minutes < 1) {
    return "—";
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;

    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatCurrency(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "৳0";
  }

  return `৳${value.toLocaleString("en-BD")}`;
}

function normalizeStatus(status) {
  if (!status) return "Pending";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function normalizePaymentStatus(status) {
  if (!status) return "Unpaid";

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1).toLowerCase()
  );
}

function getStatusClasses(status) {
  switch (status) {
    case "Confirmed":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Completed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    default:
      return "border-white/10 bg-white/5 text-white/50";
  }
}

function getPaymentClasses(payment) {
  switch (payment) {
    case "Paid":
      return "text-emerald-400/80";

    case "Pending":
      return "text-amber-400/80";

    case "Failed":
      return "text-red-400/80";

    case "Refunded":
      return "text-blue-400/80";

    case "Unpaid":
      return "text-white/35";

    default:
      return "text-white/35";
  }
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#07101D] pl-4 pr-10 text-sm text-white/70 outline-none transition focus:border-blue-400/30"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#07101D] text-white"
          >
            {option}
          </option>
        ))}
      </select>

      <FiChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
      />
    </div>
  );
}

function normalizeBooking(booking) {
  return {
    id: booking.id || "",
    bookingReference: booking.bookingReference || "",
    bookingGroupReference:
      booking.bookingGroupReference || "",

    customer: booking.customer?.name || "Unknown customer",
    email: booking.customer?.email || "",
    phone: booking.customer?.phone || "",

    service: booking.service?.name || "Unknown service",
    facility: booking.facility?.name || "Unknown facility",

    facilityId: booking.facility?.id || "",
    serviceId: booking.service?.id || "",

    date: formatDateInput(booking.bookingDate),

    startTime: booking.startTime || "",
    endTime: booking.endTime || "",

    time: formatTimeRange(
      booking.startTime,
      booking.endTime
    ),

    duration: formatDuration(
      booking.durationMinutes
    ),

    durationMinutes:
      booking.durationMinutes || 0,

    guests: Number(booking.quantity) || 0,
    amount: Number(booking.totalAmount) || 0,

    priceAtBooking:
      Number(booking.priceAtBooking) || 0,

    movieName: booking.movieName || "",

    status: normalizeStatus(booking.status),

    payment: normalizePaymentStatus(
      booking.paymentStatus
    ),

    paymentTransactionId:
      booking.paymentTransactionId || "",

    paymentValidationId:
      booking.paymentValidationId || "",

    paymentBankTransactionId:
      booking.paymentBankTransactionId || "",

    paymentCardType:
      booking.paymentCardType || "",

    paymentMethod:
      booking.paymentMethod || "",

    paymentInitiatedAt:
      booking.paymentInitiatedAt || null,

    paymentPaidAt:
      booking.paymentPaidAt || null,

    expiresAt:
      booking.expiresAt || null,

    checkedIn: Boolean(booking.checkedIn),
    checkedInAt: booking.checkedInAt || null,

    checkedOut: Boolean(booking.checkedOut),
    checkedOutAt: booking.checkedOutAt || null,

    cancelledAt:
      booking.cancelledAt || null,

    cancellationReason:
      booking.cancellationReason || "",

    createdAt:
      booking.createdAt || null,

    updatedAt:
      booking.updatedAt || null,
  };
}

export default function AdminBookingsPage() {
  const [search, setSearch] = useState("");
  const [facility, setFacility] =
    useState("All Facilities");

  const [status, setStatus] =
    useState("All Statuses");

  const [paymentStatus, setPaymentStatus] =
    useState("All Payments");

  const [date, setDate] = useState("");

  const [bookings, setBookings] = useState([]);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: BOOKINGS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const fetchBookings = useCallback(
    async ({
      silent = false,
      signal,
    } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        params.set(
          "page",
          String(pagination.page || 1)
        );

        params.set(
          "limit",
          String(BOOKINGS_PER_PAGE)
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (
          facility &&
          facility !== "All Facilities"
        ) {
          params.set("facilityId", "");
        }

        if (status !== "All Statuses") {
          params.set(
            "status",
            status.toLowerCase()
          );
        }

        if (
          paymentStatus !== "All Payments"
        ) {
          params.set(
            "paymentStatus",
            paymentStatus.toLowerCase()
          );
        }

        if (date) {
          params.set("date", date);
        }

        /*
         * -----------------------------------------------------
         * IMPORTANT
         * -----------------------------------------------------
         * The admin API currently accepts facilityId,
         * not facility name.
         *
         * We therefore fetch the complete booking page when
         * using the facility-name filter and filter it below.
         *
         * This keeps this page compatible with the current API
         * without changing the backend contract.
         */

        params.delete("facilityId");

        const response = await fetch(
          `/api/bookings/admin?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.error ||
              "Unable to load bookings."
          );
        }

        const normalizedBookings = Array.isArray(
          data.data
        )
          ? data.data.map(normalizeBooking)
          : [];

        setBookings(normalizedBookings);

        setPagination(
          data.pagination || {
            page: 1,
            limit: BOOKINGS_PER_PAGE,
            total: normalizedBookings.length,
            totalPages: 1,
          }
        );

        setLastUpdated(new Date());
      } catch (fetchError) {
        if (
          fetchError?.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Admin booking fetch error:",
          fetchError
        );

        setError(
          fetchError?.message ||
            "Unable to load bookings."
        );
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      date,
      facility,
      pagination.page,
      paymentStatus,
      search,
      status,
    ]
  );

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD + FILTER CHANGES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const controller =
      new AbortController();

    fetchBookings({
      silent: false,
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [
    search,
    facility,
    status,
    paymentStatus,
    date,
    fetchBookings,
  ]);

  /*
   * ---------------------------------------------------------
   * AUTO REFRESH
   *
   * New bookings will appear automatically.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings({
        silent: true,
      });
    }, AUTO_REFRESH_MS);

    return () => {
      clearInterval(interval);
    };
  }, [fetchBookings]);

  /*
   * ---------------------------------------------------------
   * FACILITY FILTER
   *
   * Current API accepts facilityId, but this UI uses facility
   * names. Filter the loaded result by name for now.
   * ---------------------------------------------------------
   */

  const filteredBookings = useMemo(() => {
    if (
      facility === "All Facilities"
    ) {
      return bookings;
    }

    return bookings.filter(
      (booking) =>
        booking.facility === facility
    );
  }, [bookings, facility]);

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */

  const totalRevenue =
    filteredBookings.reduce(
      (total, booking) =>
        total + booking.amount,
      0
    );

  const confirmedCount =
    filteredBookings.filter(
      (booking) =>
        booking.status === "Confirmed"
    ).length;

  const guestCount =
    filteredBookings.reduce(
      (total, booking) =>
        total + booking.guests,
      0
    );

  const pendingCount =
    filteredBookings.filter(
      (booking) =>
        booking.status === "Pending"
    ).length;

  /*
   * ---------------------------------------------------------
   * REFRESH
   * ---------------------------------------------------------
   */

  const handleRefresh = () => {
    fetchBookings({
      silent: true,
    });
  };

  /*
   * ---------------------------------------------------------
   * RESET
   * ---------------------------------------------------------
   */

  const resetFilters = () => {
    setSearch("");
    setFacility("All Facilities");
    setStatus("All Statuses");
    setPaymentStatus("All Payments");
    setDate("");
  };

  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */

  if (
    loading &&
    bookings.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#050A14]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="mb-8">
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center text-xs font-medium text-white/35 transition hover:text-blue-400"
            >
              ← Dashboard
            </Link>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              Booking Management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Bookings
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Loading customer bookings...
            </p>
          </header>

          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-8">
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <FiRefreshCw
                size={25}
                className="animate-spin text-blue-400"
              />

              <p className="mt-4 text-sm text-white/50">
                Loading bookings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A14]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center text-xs font-medium text-white/35 transition hover:text-blue-400"
            >
              ← Dashboard
            </Link>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              Booking Management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Bookings
            </h1>

            <p className="mt-2 text-sm text-white/40">
              View and manage all customer bookings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </header>

        {/* Error */}
        {error && (
          <section className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-red-300">
                  Unable to load bookings
                </p>

                <p className="mt-1 text-xs text-red-300/60">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="w-fit rounded-lg border border-red-400/20 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10"
              >
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Summary */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Total Bookings
              </p>

              <FiCalendar
                className="text-blue-400"
                size={18}
              />
            </div>

            <p className="mt-3 text-3xl font-semibold text-white">
              {filteredBookings.length}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Matching current filters
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Confirmed
              </p>

              <FiUsers
                className="text-emerald-400"
                size={18}
              />
            </div>

            <p className="mt-3 text-3xl font-semibold text-white">
              {confirmedCount}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Active confirmed bookings
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Guests
              </p>

              <FiUsers
                className="text-blue-400"
                size={18}
              />
            </div>

            <p className="mt-3 text-3xl font-semibold text-white">
              {guestCount}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Total guests in results
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Booking Value
              </p>

              <span className="text-sm font-semibold text-blue-400">
                ৳
              </span>
            </div>

            <p className="mt-3 text-3xl font-semibold text-white">
              {formatCurrency(
                totalRevenue
              )}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Total value of results
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-[#07101D] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <FiFilter
              size={16}
              className="text-blue-400"
            />

            <h2 className="text-sm font-semibold text-white">
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_160px_160px_180px_auto]">
            {/* Search */}
            <div className="relative">
              <FiSearch
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search customer, booking ID, service..."
                className="h-11 w-full rounded-xl border border-white/10 bg-[#050A14] pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-blue-400/30"
              />
            </div>

            <FilterSelect
              value={facility}
              onChange={setFacility}
              options={FACILITIES}
            />

            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUSES}
            />

            <FilterSelect
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={PAYMENT_STATUSES}
            />

            <div className="relative">
              <FiCalendar
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#07101D] pl-10 pr-3 text-sm text-white/70 outline-none transition focus:border-blue-400/30"
              />
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Live indicator */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>

            <span className="text-xs text-white/35">
              Live booking updates enabled
            </span>

            {pendingCount > 0 && (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                {pendingCount} pending
              </span>
            )}
          </div>

          {lastUpdated && (
            <p className="text-xs text-white/25">
              Updated{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Bookings table */}
        <section className="rounded-2xl border border-white/10 bg-[#07101D] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                All Bookings
              </h2>

              <p className="mt-1 text-sm text-white/40">
                {filteredBookings.length} booking
                {filteredBookings.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <p className="text-xs text-white/25">
              Auto-refreshes every 10 seconds
            </p>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
              <FiCalendar
                size={28}
                className="text-white/20"
              />

              <h3 className="mt-4 text-sm font-semibold text-white">
                No bookings found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-white/35">
                Try changing your search or filters
                to find the booking you are looking
                for.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/60 transition hover:border-blue-400/20 hover:text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                {/* Table header */}
                <div className="grid grid-cols-[125px_minmax(170px,1.2fr)_minmax(190px,1.4fr)_175px_80px_125px_80px] gap-4 border-b border-white/10 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  <span>Booking ID</span>
                  <span>Customer</span>
                  <span>Service</span>
                  <span>Date & Time</span>
                  <span>Guests</span>
                  <span>Amount</span>
                  <span />
                </div>

                {/* Rows */}
                <div className="divide-y divide-white/[0.06]">
                  {filteredBookings.map(
                    (booking) => (
                      <div
                        key={booking.id}
                        className="grid grid-cols-[125px_minmax(170px,1.2fr)_minmax(190px,1.4fr)_175px_80px_125px_80px] items-center gap-4 px-3 py-4 transition hover:bg-white/[0.015]"
                      >
                        <div>
                          <span className="text-xs font-semibold text-blue-400">
                            #
                            {booking.bookingReference ||
                              booking.id}
                          </span>

                          {booking.status ===
                            "Pending" && (
                            <span className="mt-1 block text-[9px] uppercase tracking-wider text-amber-400/60">
                              New
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/80">
                            {booking.customer}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-white/30">
                            {booking.phone}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/70">
                            {booking.service}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-white/30">
                            {booking.facility}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-white/65">
                            {formatDate(
                              booking.date
                            )}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/30">
                            <FiClock size={11} />

                            {booking.time}
                          </p>
                        </div>

                        <span className="text-sm text-white/60">
                          {booking.guests}
                        </span>

                        <div>
                          <p className="text-sm font-medium text-white/75">
                            {formatCurrency(
                              booking.amount
                            )}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${getPaymentClasses(
                              booking.payment
                            )}`}
                          >
                            {booking.payment}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBooking(
                                booking
                              )
                            }
                            aria-label={`View ${booking.bookingReference}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-white/35 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-blue-400"
                          >
                            <FiEye
                              size={15}
                            />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedBooking(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#07101D] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Booking Details
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  #
                  {selectedBooking.bookingReference ||
                    selectedBooking.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(null)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {/* Customer */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  Customer
                </p>

                <p className="mt-2 text-sm font-medium text-white">
                  {selectedBooking.customer}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  {selectedBooking.email}
                </p>

                <p className="mt-1 text-xs text-white/40">
                  {selectedBooking.phone}
                </p>
              </div>

              {/* Booking */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Facility
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.facility}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Service
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.service}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Date
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {formatDate(
                      selectedBooking.date
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Time
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.time}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Duration
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.duration}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Guests
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.guests}
                  </p>
                </div>
              </div>

              {/* Movie */}
              {selectedBooking.movieName && (
                <div className="border-t border-white/10 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Movie
                  </p>

                  <p className="mt-2 text-sm text-white/70">
                    {selectedBooking.movieName}
                  </p>
                </div>
              )}

              {/* References */}
              <div className="border-t border-white/10 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  Booking Group
                </p>

                <p className="mt-2 break-all font-mono text-[11px] text-white/45">
                  {selectedBooking.bookingGroupReference ||
                    "—"}
                </p>
              </div>

              {/* Payment */}
              <div className="border-t border-white/10 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  Payment
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-white/25">
                      Status
                    </p>

                    <p
                      className={`mt-1 text-sm ${getPaymentClasses(
                        selectedBooking.payment
                      )}`}
                    >
                      {selectedBooking.payment}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/25">
                      Method
                    </p>

                    <p className="mt-1 text-sm text-white/60">
                      {selectedBooking.paymentMethod ||
                        "—"}
                    </p>
                  </div>
                </div>

                {selectedBooking.paymentTransactionId && (
                  <div className="mt-4">
                    <p className="text-[10px] text-white/25">
                      Transaction ID
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-white/40">
                      {
                        selectedBooking.paymentTransactionId
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Amount + Status */}
              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Amount
                  </p>

                  <p className="mt-1 text-xl font-semibold text-white">
                    {formatCurrency(
                      selectedBooking.amount
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${getStatusClasses(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status}
                  </span>

                  <span
                    className={`rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold ${getPaymentClasses(
                      selectedBooking.payment
                    )}`}
                  >
                    {selectedBooking.payment}
                  </span>
                </div>
              </div>

              {/* Check-in status */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Check-in
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {selectedBooking.checkedIn
                      ? "Checked in"
                      : "Not checked in"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Check-out
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {selectedBooking.checkedOut
                      ? "Checked out"
                      : "Not checked out"}
                  </p>
                </div>
              </div>

              {/* Created */}
              {selectedBooking.createdAt && (
                <div className="border-t border-white/10 pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                    Created
                  </p>

                  <p className="mt-2 text-xs text-white/40">
                    {new Date(
                      selectedBooking.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}