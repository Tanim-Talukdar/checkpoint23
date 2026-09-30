"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiFilm,
  FiMail,
  FiPhone,
  FiUser,
  FiX,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";

const rows = ["A", "B", "C", "D", "E"];

const seats = rows.flatMap((row) =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `${row}${index + 1}`,
    row,
    number: index + 1,
  }))
);

const sectionClass =
  "rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5";

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-4 text-sm text-white outline-none transition focus:border-blue-500/50";

const dateTimeInputClass =
  `${inputClass} [color-scheme:dark]`;

const selectClass =
  `${inputClass} appearance-none pr-10`;

const mutedLabelClass =
  "mb-2 block text-sm text-slate-300";

const sectionTitleClass =
  "mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500";

const smallTextClass =
  "text-xs text-slate-500";

const notificationStyles = {
  success: {
    wrapper:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: <FiCheck className="text-lg" />,
  },
  error: {
    wrapper:
      "border-red-500/30 bg-red-500/10 text-red-400",
    icon: <FiX className="text-lg" />,
  },
  warning: {
    wrapper:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    icon: <FiAlertCircle className="text-lg" />,
  },
  info: {
    wrapper:
      "border-blue-500/30 bg-blue-500/10 text-blue-400",
    icon: <FiInfo className="text-lg" />,
  },
};

export default function AddManualBookingPage() {
  const router = useRouter();

  const [bookingType, setBookingType] = useState("seat");

  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [notification, setNotification] = useState({
    show: false,
    type: "info",
    message: "",
  });

  const [form, setForm] = useState({
    movieId: "",
    showtimeId: "",
    movieName: "",
    time: "",
    date: "",
    customerName: "",
    phone: "",
    email: "",
    amount: "2500",
  });

  // ==================================================
  // NOTIFICATION
  // ==================================================

  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setNotification((prev) => ({
        ...prev,
        show: false,
      }));
    }, 4000);
  };

  const closeNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const notificationStyle =
    notificationStyles[notification.type] ||
    notificationStyles.info;

  // ==================================================
  // LOAD MOVIES
  // ==================================================

  useEffect(() => {
    if (bookingType !== "seat") return;

    async function loadMovies() {
      try {
        setLoadingMovies(true);

        const res = await fetch("/api/movies", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load movies"
          );
        }

        setMovies(data.movies || []);
      } catch (error) {
        console.error("Load movies error:", error);

        setMovies([]);

        showNotification(
          "error",
          "Failed to load movies."
        );
      } finally {
        setLoadingMovies(false);
      }
    }

    loadMovies();
  }, [bookingType]);

  // ==================================================
  // LOAD SHOWTIMES
  // ==================================================

  useEffect(() => {
    if (bookingType !== "seat") return;

    if (!form.movieId) {
      setShowtimes([]);
      setOccupiedSeats([]);
      return;
    }

    async function loadShowtimes() {
      try {
        setLoadingShowtimes(true);
        setShowtimes([]);
        setOccupiedSeats([]);

        const res = await fetch(
          `/api/showtimes?movieId=${encodeURIComponent(
            form.movieId
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load showtimes"
          );
        }

        setShowtimes(data.showtimes || []);
      } catch (error) {
        console.error(
          "Load showtimes error:",
          error
        );

        setShowtimes([]);

        showNotification(
          "error",
          "Failed to load showtimes."
        );
      } finally {
        setLoadingShowtimes(false);
      }
    }

    loadShowtimes();
  }, [bookingType, form.movieId]);

  // ==================================================
  // SELECTED SHOWTIME
  // ==================================================

  const selectedShowtime = useMemo(
    () =>
      showtimes.find(
        (showtime) =>
          showtime._id === form.showtimeId
      ),
    [showtimes, form.showtimeId]
  );

  // ==================================================
  // PRICE
  // ==================================================

  const seatPrice = Number(
    selectedShowtime?.ticketPrice || 0
  );

  const seatBookingTotal =
    selectedSeats.length * seatPrice;

  // ==================================================
  // INPUT
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // BOOKING TYPE
  // ==================================================

  const handleBookingTypeChange = (type) => {
    setBookingType(type);

    setSelectedSeats([]);
    setOccupiedSeats([]);
    setShowtimes([]);

    setForm((prev) => ({
      ...prev,
      movieId: "",
      showtimeId: "",
      movieName: "",
      time: "",
      date: "",
      amount:
        type === "full-hall"
          ? "2500"
          : prev.amount,
    }));
  };

  // ==================================================
  // MOVIE CHANGE
  // ==================================================

  const handleMovieChange = (e) => {
    const movieId = e.target.value;

    setForm((prev) => ({
      ...prev,
      movieId,
      showtimeId: "",
      date: "",
      time: "",
    }));

    setSelectedSeats([]);
    setOccupiedSeats([]);
  };

  // ==================================================
  // SHOWTIME CHANGE
  // ==================================================

  const handleShowtimeChange = async (e) => {
    const showtimeId = e.target.value;

    const showtime = showtimes.find(
      (item) => item._id === showtimeId
    );

    setForm((prev) => ({
      ...prev,
      showtimeId,
      date: showtime?.date || "",
      time: showtime?.startTime || "",
    }));

    setSelectedSeats([]);
    setOccupiedSeats([]);

    if (!showtimeId) return;

    try {
      setLoadingSeats(true);

      const res = await fetch(
        `/api/bookings/occupied?showtimeId=${encodeURIComponent(
          showtimeId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load occupied seats"
        );
      }

      setOccupiedSeats(
        data.occupiedSeats || []
      );
    } catch (error) {
      console.error(
        "Load occupied seats error:",
        error
      );

      setOccupiedSeats([]);

      showNotification(
        "error",
        "Failed to load seat availability. Please try again."
      );
    } finally {
      setLoadingSeats(false);
    }
  };

  // ==================================================
  // SEAT SELECT
  // ==================================================

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) {
      showNotification(
        "warning",
        `${seatId} is already occupied.`
      );

      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter(
          (seat) => seat !== seatId
        );
      }

      if (prev.length >= 8) {
        showNotification(
          "warning",
          "Maximum 8 seats allowed."
        );

        return prev;
      }

      return [...prev, seatId];
    });
  };

  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      let payload;

      // ==========================================
      // SEAT BOOKING
      // ==========================================

      if (bookingType === "seat") {
        if (!form.movieId) {
          showNotification(
            "warning",
            "Please select a movie."
          );
          return;
        }

        if (!form.showtimeId) {
          showNotification(
            "warning",
            "Please select a showtime."
          );
          return;
        }

        if (selectedSeats.length === 0) {
          showNotification(
            "warning",
            "Please select at least one seat."
          );
          return;
        }

        const occupiedSelectedSeats =
          selectedSeats.filter((seat) =>
            occupiedSeats.includes(seat)
          );

        if (occupiedSelectedSeats.length > 0) {
          showNotification(
            "error",
            `Already booked: ${occupiedSelectedSeats.join(
              ", "
            )}`
          );

          return;
        }

        payload = {
          bookingType: "seat",
          movieId: form.movieId,
          showtimeId: form.showtimeId,
          date: form.date,
          time: form.time,
          hallId: "hall-1",
          seats: selectedSeats,
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          paymentMethod: "cash",
          totalAmount: seatBookingTotal,
        };
      }

      // ==========================================
      // FULL HALL
      // ==========================================

      else {
        if (!form.movieName.trim()) {
          showNotification(
            "warning",
            "Please enter movie name."
          );
          return;
        }

        if (!form.date) {
          showNotification(
            "warning",
            "Please select a date."
          );
          return;
        }

        if (!form.time) {
          showNotification(
            "warning",
            "Please select a time."
          );
          return;
        }

        const amount = Number(form.amount);

        if (
          !Number.isFinite(amount) ||
          amount < 0
        ) {
          showNotification(
            "warning",
            "Please enter a valid amount."
          );
          return;
        }

        payload = {
          bookingType: "full-hall",
          movieName: form.movieName.trim(),
          date: form.date,
          time: form.time,
          hallId: "hall-1",
          seats: [],
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          paymentMethod: "cash",
          amount,
        };
      }

      // ==========================================
      // API
      // ==========================================

      const res = await fetch(
        "/api/manual-bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification(
          "error",
          data.message ||
            "Failed to create booking."
        );

        return;
      }

      showNotification(
        "success",
        "Manual booking created successfully."
      );

      setTimeout(() => {
        router.push(
          "/admin/manual-bookings"
        );

        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(
        "Manual booking submit error:",
        error
      );

      showNotification(
        "error",
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* ==================================================
          NOTIFICATION
      ================================================== */}

      <div
        className={`fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm transition-all duration-300 ${
          notification.show
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${notificationStyle.wrapper}`}
        >
          <div className="mt-0.5 shrink-0">
            {notificationStyle.icon}
          </div>

          <p className="flex-1 text-sm font-medium leading-5 text-white">
            {notification.message}
          </p>

          <button
            type="button"
            onClick={closeNotification}
            className="shrink-0 text-slate-500 transition hover:text-white"
          >
            <FiX />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] transition hover:bg-white/[0.06]"
          >
            <FiArrowLeft />
          </button>

          <div>
            <h1 className="text-2xl font-semibold">
              Add Manual Booking
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create an offline cash booking
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* BOOKING TYPE */}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              Booking Type
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <BookingTypeButton
                active={bookingType === "seat"}
                onClick={() =>
                  handleBookingTypeChange("seat")
                }
                title="Seat Booking"
                description="Select movie, showtime and seats"
              />

              <BookingTypeButton
                active={
                  bookingType === "full-hall"
                }
                onClick={() =>
                  handleBookingTypeChange(
                    "full-hall"
                  )
                }
                title="Full Hall"
                description="Book the entire Hall 1"
              />
            </div>
          </section>

          {/* MOVIE & SHOWTIME */}

          {bookingType === "seat" && (
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Movie & Showtime
              </h2>

              <div className="grid gap-5 md:grid-cols-2">
                {/* MOVIE */}

                <div>
                  <label className={mutedLabelClass}>
                    Movie
                  </label>

                  <div className="relative">
                    <select
                      value={form.movieId}
                      onChange={handleMovieChange}
                      disabled={loadingMovies}
                      className={selectClass}
                    >
                      <option
                        value=""
                        className="bg-[#07101c] text-white"
                      >
                        {loadingMovies
                          ? "Loading movies..."
                          : "Select movie"}
                      </option>

                      {movies.map((movie) => (
                        <option
                          key={movie._id}
                          value={movie._id}
                          className="bg-[#07101c] text-white"
                        >
                          {movie.title}
                        </option>
                      ))}
                    </select>

                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                {/* SHOWTIME */}

                <div>
                  <label className={mutedLabelClass}>
                    Showtime
                  </label>

                  <div className="relative">
                    <select
                      value={form.showtimeId}
                      onChange={
                        handleShowtimeChange
                      }
                      disabled={
                        !form.movieId ||
                        loadingShowtimes
                      }
                      className={selectClass}
                    >
                      <option
                        value=""
                        className="bg-[#07101c] text-white"
                      >
                        {!form.movieId
                          ? "Select movie first"
                          : loadingShowtimes
                          ? "Loading showtimes..."
                          : "Select showtime"}
                      </option>

                      {showtimes.map((showtime) => (
                        <option
                          key={showtime._id}
                          value={showtime._id}
                          className="bg-[#07101c] text-white"
                        >
                          {showtime.date} •{" "}
                          {showtime.startTime} • ৳
                          {showtime.ticketPrice}
                        </option>
                      ))}
                    </select>

                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              </div>

              {selectedShowtime && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoCard
                    label="Date"
                    value={selectedShowtime.date}
                  />

                  <InfoCard
                    label="Time"
                    value={selectedShowtime.startTime}
                  />

                  <InfoCard
                    label="Price / Seat"
                    value={`৳${seatPrice}`}
                  />
                </div>
              )}
            </section>
          )}

          {/* FULL HALL */}

          {bookingType === "full-hall" && (
            <section className={sectionClass}>
              <h2 className={sectionTitleClass}>
                Full Hall Details
              </h2>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className={mutedLabelClass}>
                    Movie Name
                  </label>

                  <input
                    type="text"
                    name="movieName"
                    value={form.movieName}
                    onChange={handleChange}
                    placeholder="Enter movie name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={mutedLabelClass}>
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={dateTimeInputClass}
                  />
                </div>

                <div>
                  <label className={mutedLabelClass}>
                    Time
                  </label>

                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className={dateTimeInputClass}
                  />
                </div>
              </div>
            </section>
          )}

          {/* HALL */}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              Hall
            </h2>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="font-semibold">
                Hall 1
              </p>

              <p className="mt-1 text-sm text-slate-500">
                50 seats • A1–E10
              </p>
            </div>
          </section>

          {/* SEATS */}

          {bookingType === "seat" &&
            selectedShowtime && (
              <section className={sectionClass}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className={sectionTitleClass.replace(
                      "mb-4 ",
                      ""
                    )}>
                      Select Seats
                    </h2>

                    <p className={smallTextClass}>
                      Maximum 8 seats
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
                    {selectedSeats.length}/8
                  </div>
                </div>

                <div className="mb-8 flex justify-center">
                  <div className="w-full max-w-md rounded-full border border-white/[0.08] bg-white/[0.03] py-2 text-center text-xs tracking-[0.3em] text-slate-500">
                    SCREEN
                  </div>
                </div>

                {loadingSeats ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Loading seat availability...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rows.map((row) => (
                      <div
                        key={row}
                        className="flex items-center gap-2"
                      >
                        <span className="w-5 text-xs text-slate-600">
                          {row}
                        </span>

                        <div className="grid flex-1 grid-cols-10 gap-1.5 sm:gap-2">
                          {seats
                            .filter(
                              (seat) =>
                                seat.row === row
                            )
                            .map((seat) => {
                              const selected =
                                selectedSeats.includes(
                                  seat.id
                                );

                              const occupied =
                                occupiedSeats.includes(
                                  seat.id
                                );

                              return (
                                <button
                                  type="button"
                                  key={seat.id}
                                  disabled={occupied}
                                  onClick={() =>
                                    toggleSeat(
                                      seat.id
                                    )
                                  }
                                  className={`aspect-square rounded-md text-[10px] font-medium transition sm:text-xs ${
                                    occupied
                                      ? "cursor-not-allowed bg-red-500 text-white"
                                      : selected
                                      ? "bg-blue-500 text-white"
                                      : "border border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]"
                                  }`}
                                >
                                  {seat.number}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
                  <SeatLegend
                    className="border border-white/[0.08] bg-white/[0.03]"
                    label="Available"
                  />

                  <SeatLegend
                    className="bg-blue-500"
                    label="Selected"
                  />

                  <SeatLegend
                    className="bg-red-500"
                    label="Occupied"
                  />
                </div>
              </section>
            )}

          {/* CUSTOMER */}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              Customer Information
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              <IconInput
                icon={<FiUser />}
                label="Name"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
                placeholder="Customer name"
              />

              <IconInput
                icon={<FiPhone />}
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="Phone number"
              />

              <IconInput
                icon={<FiMail />}
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email (optional)"
              />
            </div>
          </section>

          {/* PAYMENT */}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              Payment
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={mutedLabelClass}>
                  Payment Method
                </label>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                  <p className="font-medium">
                    Cash
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Manual booking only
                  </p>
                </div>
              </div>

              {bookingType === "full-hall" && (
                <div>
                  <label className={mutedLabelClass}>
                    Amount
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Default amount: ৳2500
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SUMMARY */}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>
              Booking Summary
            </h2>

            {bookingType === "seat" ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Seats
                  </span>

                  <span>
                    {selectedSeats.length
                      ? selectedSeats.join(", ")
                      : "None"}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Price / seat
                  </span>

                  <span>
                    ৳{seatPrice}
                  </span>
                </div>

                <div className="border-t border-white/[0.08] pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-bold">
                      ৳{seatBookingTotal}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="font-semibold">
                  Full Hall Total
                </span>

                <span className="text-xl font-bold">
                  ৳{Number(form.amount || 2500)}
                </span>
              </div>
            )}
          </section>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <FiClock className="animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <FiCheck />
                Create Manual Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================================================
// SMALL UI COMPONENTS
// ==================================================

function BookingTypeButton({
  active,
  onClick,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-blue-500/50 bg-blue-500/10"
          : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-center gap-3">
        <FiFilm
          className={
            active
              ? "text-blue-400"
              : "text-slate-400"
          }
        />

        <div>
          <p className="font-semibold">
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
  );
}

function SeatLegend({ className, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-sm ${className}`}
      />
      {label}
    </div>
  );
}

function IconInput({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
}) {
  return (
    <div>
      <label className={mutedLabelClass}>
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`${inputClass} pl-11`}
        />
      </div>
    </div>
  );
}