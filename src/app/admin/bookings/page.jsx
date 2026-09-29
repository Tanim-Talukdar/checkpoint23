"use client";

import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiMapPin,
  FiUsers,
  FiChevronDown,
  FiChevronUp,
  FiFilm,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expanded, setExpanded] = useState(null);

  const [search, setSearch] = useState("");

  const [movieFilter, setMovieFilter] = useState("");
  const [showtimeFilter, setShowtimeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentFilter, setPaymentFilter] =
    useState("all");
  const [bookingFilter, setBookingFilter] =
    useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    totalBookings: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  });

  const [movieOptions, setMovieOptions] =
    useState([]);

  const [showtimeOptions, setShowtimeOptions] =
    useState([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [
    page,
    search,
    movieFilter,
    showtimeFilter,
    dateFilter,
    paymentFilter,
    bookingFilter,
  ]);

  async function fetchFilterOptions() {
    try {
      const [moviesResponse, showtimesResponse] =
        await Promise.all([
          fetch("/api/movies"),
          fetch("/api/showtimes"),
        ]);

      const moviesData =
        await moviesResponse.json();

      const showtimesData =
        await showtimesResponse.json();

      if (moviesResponse.ok) {
        setMovieOptions(
          moviesData.movies || []
        );
      }

      if (showtimesResponse.ok) {
        setShowtimeOptions(
          showtimesData.showtimes || []
        );
      }
    } catch (error) {
      console.error(
        "Fetch filter options error:",
        error
      );
    }
  }

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", page);
      params.set("limit", limit);

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (movieFilter) {
        params.set(
          "movieId",
          movieFilter
        );
      }

      if (showtimeFilter) {
        params.set(
          "showtimeId",
          showtimeFilter
        );
      }

      if (dateFilter) {
        params.set(
          "date",
          dateFilter
        );
      }

      if (paymentFilter !== "all") {
        params.set(
          "paymentStatus",
          paymentFilter
        );
      }

      if (bookingFilter !== "all") {
        params.set(
          "bookingStatus",
          bookingFilter
        );
      }

      const response = await fetch(
        `/api/bookings/admin?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch bookings"
        );
      }

      setBookings(data.payments || []);

      setTotal(
        data.pagination?.total || 0
      );

      setTotalPages(
        data.pagination?.totalPages || 1
      );

      setStats(
        data.stats || {
          totalBookings: 0,
          paidCount: 0,
          pendingCount: 0,
          failedCount: 0,
          cancelledCount: 0,
          totalRevenue: 0,
        }
      );

      setExpanded(null);
    } catch (error) {
      console.error(
        "Fetch bookings error:",
        error
      );

      setError(
        error.message ||
          "Failed to fetch bookings"
      );

      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(
    setter,
    value
  ) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setMovieFilter("");
    setShowtimeFilter("");
    setDateFilter("");
    setPaymentFilter("all");
    setBookingFilter("all");
    setPage(1);
  }

  const hasFilters =
    search ||
    movieFilter ||
    showtimeFilter ||
    dateFilter ||
    paymentFilter !== "all" ||
    bookingFilter !== "all";

  function toggleBooking(id) {
    setExpanded((current) =>
      current === id ? null : id
    );
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-BD",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getPaymentClass(status) {
    switch (status) {
      case "paid":
        return "border-green-500/20 bg-green-500/10 text-green-400";

      case "failed":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "cancelled":
        return "border-gray-500/20 bg-gray-500/10 text-gray-400";

      default:
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }
  }

  function getBookingClass(status) {
    switch (status) {
      case "confirmed":
        return "border-green-500/20 bg-green-500/10 text-green-400";

      case "cancelled":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      default:
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
    }
  }

  return (
    <main className="min-h-screen bg-[#050A14] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Bookings
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              View and manage all movie bookings
            </p>
          </div>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                handleSearchChange(
                  e.target.value
                )
              }
              placeholder="Search name, email, phone, movie, seat, booking ID..."
              className="w-full rounded-xl border border-white/10 bg-[#07101c] py-3 pl-11 pr-11 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  handleSearchChange("")
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          {/* Movie */}
          <select
            value={movieFilter}
            onChange={(e) =>
              handleFilterChange(
                setMovieFilter,
                e.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#07101c] px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="">
              All Movies
            </option>

            {movieOptions.map((movie) => (
              <option
                key={movie._id}
                value={movie._id}
              >
                {movie.title}
              </option>
            ))}
          </select>

          {/* Showtime */}
          <select
            value={showtimeFilter}
            onChange={(e) =>
              handleFilterChange(
                setShowtimeFilter,
                e.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#07101c] px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="">
              All Showtimes
            </option>

            {showtimeOptions.map(
              (showtime) => (
                <option
                  key={showtime._id}
                  value={showtime._id}
                >
                  {showtime.date} •{" "}
                  {showtime.startTime} •{" "}
                  {showtime.movieId?.title ||
                    "Movie"}
                </option>
              )
            )}
          </select>

          {/* Date */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) =>
              handleFilterChange(
                setDateFilter,
                e.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#07101c] px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          />

          {/* Payment */}
          <select
            value={paymentFilter}
            onChange={(e) =>
              handleFilterChange(
                setPaymentFilter,
                e.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#07101c] px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">
              All Payments
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          {/* Booking */}
          <select
            value={bookingFilter}
            onChange={(e) =>
              handleFilterChange(
                setBookingFilter,
                e.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#07101c] px-3 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/50"
          >
            <option value="all">
              All Bookings
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {bookings.length} of{" "}
              {total} bookings
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs text-slate-400 transition hover:text-white"
            >
              <FiX />
              Clear filters
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.totalBookings}
          />

          <StatCard
            title="Confirmed"
            value={stats.paidCount}
          />

          <StatCard
            title="Pending"
            value={stats.pendingCount}
          />

          <StatCard
            title="Cancelled"
            value={stats.cancelledCount}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-white/5"
                />
              )
            )}
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          bookings.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#07101c] p-10 text-center">
              <FiFilm className="mx-auto mb-4 text-4xl text-slate-600" />

              <h2 className="text-lg font-semibold">
                {hasFilters
                  ? "No matching bookings"
                  : "No bookings yet"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {hasFilters
                  ? "Try changing your search or filters."
                  : "Customer bookings will appear here."}
              </p>
            </div>
          )}

        {/* Booking List */}
        {!loading && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const movie =
                booking.movie;

              const showtime =
                booking.showtime;

              const hall =
                booking.hallId;

              const isExpanded =
                expanded === booking._id;

              return (
                <div
                  key={booking._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#07101c] shadow-lg shadow-black/10"
                >
                  {/* Booking Header */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleBooking(
                        booking._id
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        {/* Movie */}
                        <div className="flex min-w-0 items-center gap-4">
                          {movie?.poster ? (
                            <img
                              src={movie.poster}
                              alt={
                                movie.title ||
                                "Movie"
                              }
                              className="h-20 w-14 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5">
                              <FiFilm className="text-slate-500" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold sm:text-lg">
                              {movie?.title ||
                                "Unknown Movie"}
                            </h2>

                            <p className="mt-1 break-all text-xs text-slate-500">
                              Booking ID:{" "}
                              {booking._id}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">
                                {showtime?.date ||
                                  "-"}
                              </span>

                              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">
                                {showtime?.startTime ||
                                  "-"}
                              </span>

                              <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-400">
                                {hall?.name ||
                                  "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Seats
                            </p>

                            <p className="font-semibold">
                              {booking.seats?.join(
                                ", "
                              ) || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Amount
                            </p>

                            <p className="font-semibold">
                              ৳
                              {
                                booking.totalAmount
                              }
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs capitalize ${getPaymentClass(
                              booking.paymentStatus
                            )}`}
                          >
                            {
                              booking.paymentStatus
                            }
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs capitalize ${getBookingClass(
                              booking.bookingStatus
                            )}`}
                          >
                            {
                              booking.bookingStatus
                            }
                          </span>

                          <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400">
                            {isExpanded ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 sm:p-6">
                      <div className="grid gap-6 lg:grid-cols-2">

                        {/* Customer */}
                        <DetailSection
                          icon={
                            <FiUser />
                          }
                          title="Customer Information"
                        >
                          <Info
                            icon={
                              <FiUser />
                            }
                            label="Name"
                            value={
                              booking.customer
                                ?.name
                            }
                          />

                          <Info
                            icon={
                              <FiMail />
                            }
                            label="Email"
                            value={
                              booking.customer
                                ?.email
                            }
                          />

                          <Info
                            icon={
                              <FiPhone />
                            }
                            label="Phone"
                            value={
                              booking.customer
                                ?.phone
                            }
                          />
                        </DetailSection>

                        {/* Movie */}
                        <DetailSection
                          icon={
                            <FiFilm />
                          }
                          title="Movie Information"
                        >
                          <Info
                            label="Movie"
                            value={
                              movie?.title
                            }
                          />

                          <Info
                            label="Duration"
                            value={
                              movie?.duration
                                ? `${movie.duration} min`
                                : "-"
                            }
                          />

                          <Info
                            label="Rating"
                            value={
                              movie?.rating ||
                              "-"
                            }
                          />

                          <Info
                            label="Movie ID"
                            value={
                              typeof booking.movieId ===
                              "object"
                                ? booking
                                    .movieId
                                    ?._id
                                : booking.movieId
                            }
                          />
                        </DetailSection>

                        {/* Showtime */}
                        <DetailSection
                          icon={
                            <FiClock />
                          }
                          title="Showtime Information"
                        >
                          <Info
                            icon={
                              <FiCalendar />
                            }
                            label="Date"
                            value={
                              showtime?.date
                            }
                          />

                          <Info
                            icon={
                              <FiClock />
                            }
                            label="Start Time"
                            value={
                              showtime?.startTime
                            }
                          />

                          <Info
                            label="Ticket Price"
                            value={
                              showtime?.ticketPrice !==
                              undefined
                                ? `৳${showtime.ticketPrice}`
                                : "-"
                            }
                          />

                          <Info
                            label="Showtime ID"
                            value={
                              typeof booking.showtimeId ===
                              "object"
                                ? booking
                                    .showtimeId
                                    ?._id
                                : booking.showtimeId
                            }
                          />
                        </DetailSection>

                        {/* Hall */}
                        <DetailSection
                          icon={
                            <FiMapPin />
                          }
                          title="Hall Information"
                        >
                          <Info
                            label="Hall"
                            value={
                              hall?.name
                            }
                          />

                          <Info
                            icon={
                              <FiUsers />
                            }
                            label="Capacity"
                            value={
                              hall?.capacity
                            }
                          />

                          <Info
                            label="Rows"
                            value={
                              hall?.rows
                            }
                          />

                          <Info
                            label="Seats Per Row"
                            value={
                              hall?.seatsPerRow
                            }
                          />

                          <Info
                            label="Hall ID"
                            value={
                              typeof booking.hallId ===
                              "object"
                                ? booking
                                    .hallId
                                    ?._id
                                : booking.hallId
                            }
                          />
                        </DetailSection>

                        {/* Seats */}
                        <DetailSection title="Selected Seats">
                          <div className="flex flex-wrap gap-2">
                            {booking.seats?.map(
                              (seat) => (
                                <span
                                  key={seat}
                                  className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300"
                                >
                                  {seat}
                                </span>
                              )
                            )}
                          </div>
                        </DetailSection>

                        {/* Payment */}
                        <DetailSection
                          icon={
                            <FiCreditCard />
                          }
                          title="Payment Information"
                        >
                          <Info
                            label="Total Amount"
                            value={`৳${booking.totalAmount}`}
                          />

                          <Info
                            label="Payment Status"
                            value={
                              booking.paymentStatus
                            }
                          />

                          <Info
                            label="Booking Status"
                            value={
                              booking.bookingStatus
                            }
                          />

                          <Info
                            label="Expires At"
                            value={formatDate(
                              booking.expiresAt
                            )}
                          />

                          <Info
                            label="Transaction ID"
                            value={
                              booking.payment
                                ?.tranId
                            }
                          />

                          <Info
                            label="Bank Transaction ID"
                            value={
                              booking.payment
                                ?.bankTranId
                            }
                          />

                          <Info
                            label="Payment Method"
                            value={
                              booking.payment
                                ?.paymentMethod
                            }
                          />
                        </DetailSection>
                      </div>

                      {/* System */}
                      <div className="mt-6">
                        <DetailSection title="System Information">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Info
                              label="Booking ID"
                              value={
                                booking._id
                              }
                            />

                            <Info
                              label="Created At"
                              value={formatDate(
                                booking.createdAt
                              )}
                            />

                            <Info
                              label="Updated At"
                              value={formatDate(
                                booking.updatedAt
                              )}
                            />

                            <Info
                              label="Expires At"
                              value={formatDate(
                                booking.expiresAt
                              )}
                            />
                          </div>
                        </DetailSection>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading &&
          totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of{" "}
                {totalPages} • {total} total
                bookings
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                    )
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
      </div>
    </main>
  );
}

/* -------------------------------------------------
   STAT CARD
------------------------------------------------- */

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#07101c] p-4">
      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------
   DETAIL SECTION
------------------------------------------------- */

function DetailSection({
  icon,
  title,
  children,
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        {icon && (
          <span className="text-blue-400">
            {icon}
          </span>
        )}

        {title}
      </h3>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------
   INFO ROW
------------------------------------------------- */

function Info({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      {icon && (
        <span className="mt-0.5 shrink-0 text-slate-500">
          {icon}
        </span>
      )}

      <div className="min-w-0">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p className="break-all text-sm text-slate-200">
          {value ?? "-"}
        </p>
      </div>
    </div>
  );
}