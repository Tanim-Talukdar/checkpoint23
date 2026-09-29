"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLoader,
  FiAlertCircle,
  FiChevronRight,
  FiMapPin,
} from "react-icons/fi";

export default function BookingPage() {
  const { movieId } = useParams();
  const router = useRouter();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // Fetch movie + showtimes
  // -----------------------------
  useEffect(() => {
    if (!movieId) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [movieRes, showtimeRes] = await Promise.all([
          fetch(`/api/movies/${movieId}`),
          fetch(`/api/showtimes?movieId=${movieId}`),
        ]);

        if (!movieRes.ok) {
          throw new Error("Failed to load movie");
        }

        if (!showtimeRes.ok) {
          throw new Error("Failed to load showtimes");
        }

        const movieData = await movieRes.json();
        const showtimeData = await showtimeRes.json();

        setMovie(movieData.movie || movieData.data || movieData);

        setShowtimes(
          showtimeData.showtimes ||
            showtimeData.data ||
            []
        );
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [movieId]);

  // -----------------------------
  // Unique dates
  // -----------------------------
  const dates = useMemo(() => {
    const unique = [
      ...new Set(showtimes.map((showtime) => showtime.date)),
    ];

    return unique.sort();
  }, [showtimes]);

  // -----------------------------
  // Set first date
  // -----------------------------
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  // -----------------------------
  // Showtimes for selected date
  // -----------------------------
  const dateShowtimes = useMemo(() => {
    return showtimes.filter(
      (showtime) => showtime.date === selectedDate
    );
  }, [showtimes, selectedDate]);

  // -----------------------------
  // Change date
  // -----------------------------
  function handleDateChange(date) {
    setSelectedDate(date);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setOccupiedSeats([]);
  }

  // -----------------------------
  // Select showtime
  // -----------------------------
  async function handleShowtimeSelect(showtime) {
    try {
      setSelectedShowtime(showtime);
      setSelectedSeats([]);
      setOccupiedSeats([]);
      setLoadingSeats(true);
      setError("");

      const response = await fetch(
        `/api/bookings/occupied?showtimeId=${showtime._id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load occupied seats"
        );
      }

      setOccupiedSeats(data.occupiedSeats || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load seats");
    } finally {
      setLoadingSeats(false);
    }
  }

  // -----------------------------
  // Hall configuration
  // -----------------------------
  const hall = selectedShowtime?.hallId;

  const rows = useMemo(() => {
    if (!hall?.rows) return [];

    if (Array.isArray(hall.rows)) {
      return hall.rows;
    }

    if (typeof hall.rows === "number") {
      return Array.from(
        { length: hall.rows },
        (_, index) => String.fromCharCode(65 + index)
      );
    }

    return [];
  }, [hall]);

  const seatsPerRow = hall?.seatsPerRow || 10;

  // -----------------------------
  // Seat toggle
  // -----------------------------
  function toggleSeat(seat) {
    if (occupiedSeats.includes(seat)) return;

    setSelectedSeats((current) => {
      if (current.includes(seat)) {
        return current.filter((item) => item !== seat);
      }

      if (current.length >= 8) {
        return current;
      }

      return [...current, seat];
    });
  }

  // -----------------------------
  // Total
  // -----------------------------
  const ticketPrice =
    Number(selectedShowtime?.ticketPrice) || 0;

  const totalAmount = ticketPrice * selectedSeats.length;

  // -----------------------------
  // Customer change
  // -----------------------------
  function handleCustomerChange(e) {
    const { name, value } = e.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // -----------------------------
  // Booking
  // -----------------------------
  async function handleBooking() {
    if (!selectedShowtime) {
      setError("Please select a showtime.");
      return;
    }

    if (selectedSeats.length === 0) {
      setError("Please select at least one seat.");
      return;
    }

    if (!customer.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!customer.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!customer.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setBooking(true);
      setError("");

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieId,
          showtimeId: selectedShowtime._id,
          hallId: selectedShowtime.hallId._id,
          seats: selectedSeats,
          customer,
          totalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create booking"
        );
      }

      const bookingId =
        data.booking?._id ||
        data.data?._id ||
        data.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID was not returned.");
      }

      router.push(
        `/movie/${movieId}/booking/payment?bookingId=${bookingId}`
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  // -----------------------------
  // Date formatter
  // -----------------------------
  function formatDate(date) {
    const d = new Date(`${date}T00:00:00`);

    return {
      day: d.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      date: d.getDate(),
      month: d.toLocaleDateString("en-US", {
        month: "short",
      }),
    };
  }

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
            <FiLoader className="animate-spin text-xl text-blue-400" />
          </div>

          <p className="text-sm text-slate-400">
            Loading booking...
          </p>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Error / Movie not found
  // -----------------------------
  if (!movie) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <FiAlertCircle className="text-2xl text-red-400" />
          </div>

          <h2 className="text-lg font-semibold">
            Unable to load movie
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error || "Movie not found"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070d] pb-32 pt-24 text-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* =========================================
            MOVIE HEADER
        ========================================== */}
        <section className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f19] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.15),transparent_35%)]" />

          <div className="relative flex gap-4 p-4 sm:p-5">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900 shadow-lg sm:h-32 sm:w-22">
              {movie.poster && (
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 py-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-blue-400">
                  Booking
                </span>
              </div>

              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {movie.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                {movie.duration && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1.5">
                    {movie.duration} min
                  </span>
                )}

                {movie.rating && (
                  <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-yellow-400">
                    ★ {movie.rating}
                  </span>
                )}

                {hall?.name && (
                  <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5">
                    <FiMapPin />
                    {hall.name}
                  </span>
                )}
              </div>

              {selectedShowtime && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-400">
                  <FiCalendar />
                  {selectedShowtime.date}
                  <span className="text-slate-600">•</span>
                  <FiClock />
                  {selectedShowtime.startTime}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================
            ERROR
        ========================================== */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300"
          >
            <FiAlertCircle className="mt-0.5 shrink-0 text-red-400" />

            <span>{error}</span>
          </motion.div>
        )}

        {/* =========================================
            DATE
        ========================================== */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-blue-400" />

                <h2 className="text-base font-semibold">
                  Select Date
                </h2>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Choose your preferred date
              </p>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {dates.map((date) => {
              const formatted = formatDate(date);
              const active = selectedDate === date;

              return (
                <button
                  key={date}
                  onClick={() => handleDateChange(date)}
                  className={`group min-w-[82px] rounded-2xl border p-3 text-center transition-all duration-200 ${
                    active
                      ? "border-blue-500 bg-blue-600 shadow-lg shadow-blue-600/20"
                      : "border-white/10 bg-[#0a0f19] hover:border-blue-500/40 hover:bg-[#0d1420]"
                  }`}
                >
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      active
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}
                  >
                    {formatted.day}
                  </div>

                  <div className="mt-1 text-2xl font-bold">
                    {formatted.date}
                  </div>

                  <div
                    className={`mt-0.5 text-[10px] ${
                      active
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}
                  >
                    {formatted.month}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================
            SHOWTIME
        ========================================== */}
        <section className="mb-6">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <FiClock className="text-blue-400" />

              <h2 className="text-base font-semibold">
                Showtime
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Select a showtime
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {dateShowtimes.map((showtime) => {
              const active =
                selectedShowtime?._id === showtime._id;

              return (
                <button
                  key={showtime._id}
                  onClick={() =>
                    handleShowtimeSelect(showtime)
                  }
                  className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                    active
                      ? "border-blue-500 bg-blue-600 shadow-lg shadow-blue-600/20"
                      : "border-white/10 bg-[#0a0f19] hover:border-blue-500/40 hover:bg-[#0d1420]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold ${
                        active
                          ? "text-white"
                          : "text-slate-200"
                      }`}
                    >
                      {showtime.startTime}
                    </span>

                    <FiChevronRight
                      className={`transition-transform ${
                        active
                          ? "text-white"
                          : "text-slate-600 group-hover:translate-x-0.5 group-hover:text-blue-400"
                      }`}
                    />
                  </div>

                  <div
                    className={`mt-1 text-xs ${
                      active
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}
                  >
                    ৳{showtime.ticketPrice} / seat
                  </div>
                </button>
              );
            })}
          </div>

          {dateShowtimes.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#0a0f19] px-4 py-6 text-center">
              <FiClock className="mx-auto mb-2 text-xl text-slate-600" />

              <p className="text-sm text-slate-500">
                No showtimes available for this date.
              </p>
            </div>
          )}
        </section>

        {/* =========================================
            SEATS
        ========================================== */}
        {selectedShowtime && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f19] shadow-xl"
          >
            {/* Seat header */}
            <div className="border-b border-white/5 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">
                    Select Seats
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose up to 8 seats
                  </p>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5">
                  <span className="text-sm font-bold text-blue-400">
                    {selectedSeats.length}
                  </span>

                  <span className="text-xs text-slate-500">
                    /8
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* SCREEN */}
              <div className="mb-8">
                <div className="mx-auto max-w-[460px]">
                  <div className="relative">
                    <div className="h-1 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_25px_rgba(59,130,246,0.6)]" />

                    <div className="mx-auto mt-1 h-5 w-[80%] rounded-[50%] bg-blue-500/5 blur-md" />
                  </div>

                  <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-600">
                    Screen
                  </p>
                </div>
              </div>

              {/* SEAT AREA */}
              {loadingSeats ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
                  <FiLoader className="animate-spin text-2xl text-blue-400" />

                  <p className="text-xs text-slate-500">
                    Loading seats...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="mx-auto min-w-[390px] max-w-[650px] space-y-2.5">
                    {rows.map((row) => (
                      <div
                        key={row}
                        className="flex items-center gap-2"
                      >
                        {/* Row label */}
                        <div className="flex w-6 shrink-0 items-center justify-center">
                          <span className="text-[10px] font-semibold text-slate-600">
                            {row}
                          </span>
                        </div>

                        {/* Seats */}
                        <div
                          className="grid flex-1 gap-1.5"
                          style={{
                            gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))`,
                          }}
                        >
                          {Array.from(
                            { length: seatsPerRow },
                            (_, index) => {
                              const seatNumber = index + 1;
                              const seat = `${row}${seatNumber}`;

                              const occupied =
                                occupiedSeats.includes(seat);

                              const selected =
                                selectedSeats.includes(seat);

                              return (
                                <button
                                  key={seat}
                                  disabled={occupied}
                                  onClick={() =>
                                    toggleSeat(seat)
                                  }
                                  aria-label={`${seat}${
                                    occupied
                                      ? " occupied"
                                      : selected
                                      ? " selected"
                                      : " available"
                                  }`}
                                  className={`group relative flex aspect-square items-center justify-center rounded-md border text-[8px] font-semibold transition-all duration-150 sm:rounded-lg sm:text-[9px] ${
                                    occupied
                                      ? "cursor-not-allowed border-red-500/30 bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.15)]"
                                      : selected
                                      ? "border-blue-400 bg-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.45)]"
                                      : "border-white/5 bg-[#111a29] text-slate-500 hover:border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-300"
                                  }`}
                                >
                                  {seatNumber}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LEGEND */}
              <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 border-t border-white/5 pt-5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[3px] border border-white/5 bg-[#111a29]" />
                  <span className="text-[10px] text-slate-500">
                    Available
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[3px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.35)]" />
                  <span className="text-[10px] text-slate-500">
                    Selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[3px] bg-red-500" />
                  <span className="text-[10px] text-slate-500">
                    Occupied
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* =========================================
            CUSTOMER INFORMATION
        ========================================== */}
        {selectedSeats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl border border-white/10 bg-[#0a0f19] p-4 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <FiUser />
              </div>

              <div>
                <h2 className="text-base font-semibold">
                  Your Information
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Required for your booking
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Full Name
                </label>

                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600" />

                  <input
                    name="name"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    placeholder="Enter your name"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#070b12] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:bg-[#080d15]"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Email
                </label>

                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600" />

                  <input
                    name="email"
                    type="email"
                    value={customer.email}
                    onChange={handleCustomerChange}
                    placeholder="Enter your email"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#070b12] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:bg-[#080d15]"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Phone Number
                </label>

                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600" />

                  <input
                    name="phone"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    placeholder="Enter your phone"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#070b12] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:bg-[#080d15]"
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* =========================================
            DESKTOP SUMMARY
        ========================================== */}
        {selectedShowtime && selectedSeats.length > 0 && (
          <section className="hidden overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0a101c] shadow-2xl md:block">
            <div className="flex items-center justify-between gap-6 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{selectedDate}</span>

                  <span className="text-slate-700">
                    •
                  </span>

                  <span>
                    {selectedShowtime.startTime}
                  </span>

                  <span className="text-slate-700">
                    •
                  </span>

                  <span>{hall?.name}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    Seats
                  </span>

                  <span className="truncate text-sm font-semibold text-blue-400">
                    {selectedSeats.join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">
                    Total
                  </p>

                  <p className="mt-0.5 text-2xl font-bold text-white">
                    ৳{totalAmount}
                  </p>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {booking ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiCreditCard />
                      Continue to Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* =========================================
          MOBILE STICKY SUMMARY
      ========================================== */}
      {selectedShowtime && selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#070b12]/95 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {selectedSeats.length} seat
                  {selectedSeats.length > 1 ? "s" : ""}
                </span>

                <span className="truncate text-[10px] text-slate-500">
                  {selectedSeats.join(", ")}
                </span>
              </div>

              <p className="mt-0.5 text-lg font-bold text-blue-400">
                ৳{totalAmount}
              </p>
            </div>

            <button
              onClick={handleBooking}
              disabled={booking}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {booking ? (
                <>
                  <FiLoader className="animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <FiCreditCard />
                  Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}