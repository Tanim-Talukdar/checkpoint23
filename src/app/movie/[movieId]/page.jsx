"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiClock,
  FiFilm,
  FiPlay,
  FiStar,
  FiCalendar,
  FiMapPin,
  FiCheck,
  FiAlertCircle,
  FiPocket,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) {
    return "Duration unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const formatReleaseDate = (date) => {
  if (!date) {
    return "Release date unavailable";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatShowtimeDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatDateParts = (date) => {
  if (!date) {
    return {
      weekday: "",
      month: "",
      day: "",
    };
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      weekday: "",
      month: "",
      day: "",
    };
  }

  return {
    weekday: parsedDate.toLocaleDateString("en-US", {
      weekday: "short",
    }),
    month: parsedDate.toLocaleDateString("en-US", {
      month: "short",
    }),
    day: parsedDate.toLocaleDateString("en-US", {
      day: "numeric",
    }),
  };
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);

  if (Number.isNaN(hour)) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
};

export default function MovieDetailsPage() {
  const params = useParams();
  const movieId = params?.movieId;

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [loading, setLoading] = useState(true);
  const [showtimesLoading, setShowtimesLoading] = useState(true);

  const [error, setError] = useState("");

  const dateScrollRef = useRef(null);

  useEffect(() => {
    if (!movieId) return;

    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/movies/${movieId}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch movie");
        }

        setMovie(data.movie);
      } catch (err) {
        console.error("Movie fetch error:", err);

        setError(err.message || "Failed to load movie");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  useEffect(() => {
    if (!movieId) return;

    const fetchShowtimes = async () => {
      try {
        setShowtimesLoading(true);

        const response = await fetch(
          `/api/showtimes?movieId=${movieId}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch showtimes"
          );
        }

        const fetchedShowtimes = data.showtimes || [];

        setShowtimes(fetchedShowtimes);

        // Automatically select the first available date
        if (fetchedShowtimes.length > 0) {
          setSelectedDate(fetchedShowtimes[0].date || "");
          setSelectedTime("");
        }
      } catch (err) {
        console.error("Showtimes fetch error:", err);

        setShowtimes([]);
        setSelectedDate("");
        setSelectedTime("");
      } finally {
        setShowtimesLoading(false);
      }
    };

    fetchShowtimes();
  }, [movieId]);

  /*
   * Create unique dates from showtimes.
   *
   * Example:
   *
   * showtimes:
   * [
   *   { date: "2026-09-10", startTime: "10:30" },
   *   { date: "2026-09-10", startTime: "14:30" },
   *   { date: "2026-09-11", startTime: "19:30" }
   * ]
   *
   * dates:
   * [
   *   "2026-09-10",
   *   "2026-09-11"
   * ]
   */
  const availableDates = useMemo(() => {
    const dates = showtimes
      .map((showtime) => showtime.date)
      .filter(Boolean);

    return [...new Set(dates)];
  }, [showtimes]);

  /*
   * Showtimes belonging to selected date.
   */
  const selectedDateShowtimes = useMemo(() => {
    if (!selectedDate) return [];

    return showtimes.filter(
      (showtime) => showtime.date === selectedDate
    );
  }, [showtimes, selectedDate]);

  const scrollDates = (direction) => {
    if (!dateScrollRef.current) return;

    dateScrollRef.current.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);

    // Reset selected time when date changes
    setSelectedTime("");
  };

  const handleTimeSelect = (showtime) => {
    setSelectedTime(showtime._id);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050A14] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

            <p className="text-sm text-slate-400">
              Loading movie...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="min-h-screen bg-[#050A14] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
            <FiAlertCircle className="mx-auto mb-4 text-4xl text-red-400" />

            <h1 className="mb-2 text-2xl font-semibold">
              Movie not found
            </h1>

            <p className="mb-6 text-sm text-slate-400">
              {error ||
                "The movie you're looking for does not exist."}
            </p>

            <Link
              href="/movie"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
            >
              <FiArrowLeft />
              Back to Movies
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050A14] text-white">
      {/* HERO */}
      <section className="relative min-h-[650px] overflow-hidden">
        <div className="absolute inset-0">
          {movie.backdrop ? (
            <img
              src={movie.backdrop}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-slate-900" />
          )}

          <div className="absolute inset-0 bg-[#050A14]/65" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />

          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-[#050A14]/50" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[650px] max-w-7xl items-end px-6 pb-16 pt-32 sm:px-8 lg:px-10">
          <div className="grid w-full items-end gap-10 lg:grid-cols-[280px_1fr]">
            {/* POSTER */}
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              className="hidden lg:block"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl">
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/3] items-center justify-center bg-slate-900">
                    <FiFilm className="text-5xl text-slate-600" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* MOVIE INFO */}
            <motion.div
              initial={{
                opacity: 0,
                x: 30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
              }}
              className="max-w-3xl"
            >
              <Link
                href="/movie"
                className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <FiArrowLeft />
                Back to Movies
              </Link>

              {/* GENRES */}
              {movie.genres &&
                movie.genres.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {movie.genres.map(
                      (genre, index) => (
                        <span
                          key={`${genre}-${index}`}
                          className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
                        >
                          {genre}
                        </span>
                      )
                    )}
                  </div>
                )}

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {movie.title}
              </h1>

              {/* META */}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <FiStar className="text-yellow-400" />

                  <span className="font-medium text-white">
                    {movie.rating
                      ? Number(movie.rating).toFixed(1)
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FiClock />

                  <span>
                    {formatDuration(movie.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FiCalendar />

                  <span>
                    {formatReleaseDate(movie.releaseDate)}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              {movie.description && (
                <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {movie.description}
                </p>
              )}

              {/* BUTTONS */}
              <div className="mt-8 flex flex-wrap gap-3">
                {movie.trailer && (
                  <a
                    href={movie.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium backdrop-blur-md transition hover:bg-white/10"
                  >
                    <FiPlay />
                    Watch Trailer
                  </a>
                )}

{showtimes.length > 0 && (
  <Link
    href={`/movie/${movie._id}/booking?showtimeId=${showtimes[0]._id}`}
    onClick={() => handleTimeSelect(showtimes[0])}
    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
  >
    <FiPocket />
    Book Tickets
    <FiArrowUpRight />
  </Link>
)}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* LEFT CONTENT */}
          <div>
            {/* SHOWTIMES */}
            <div id="showtimes">
              <div className="mb-7">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                  Book your seat
                </p>

                <h2 className="text-3xl font-bold">
                  Choose your showtime
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Select a date and time to continue with
                  your booking.
                </p>
              </div>

              {/* LOADING */}
              {showtimesLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

                    Loading showtimes...
                  </div>
                </div>
              ) : showtimes.length === 0 ? (
                /* EMPTY */
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                  <FiCalendar className="mb-4 text-3xl text-slate-500" />

                  <h3 className="text-lg font-semibold">
                    No showtimes available
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    There are currently no scheduled
                    showtimes for this movie.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* DATE SELECTOR */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Select Date
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Choose the day you want to watch
                        </p>
                      </div>

                      {/* DESKTOP ARROWS */}
                      <div className="hidden gap-2 sm:flex">
                        <button
                          type="button"
                          onClick={() => scrollDates("left")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white"
                          aria-label="Previous dates"
                        >
                          <FiChevronLeft />
                        </button>

                        <button
                          type="button"
                          onClick={() => scrollDates("right")}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white"
                          aria-label="Next dates"
                        >
                          <FiChevronRight />
                        </button>
                      </div>
                    </div>

                    {/* HORIZONTAL DATES */}
                    <div
                      ref={dateScrollRef}
                      className="scrollbar-none flex gap-3 overflow-x-auto pb-2"
                    >
                      {availableDates.map((date) => {
                        const parts = formatDateParts(date);
                        const isSelected =
                          selectedDate === date;

                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() =>
                              handleDateSelect(date)
                            }
                            className={`min-w-[100px] shrink-0 rounded-2xl border p-4 text-center transition ${
                              isSelected
                                ? "border-blue-500 bg-blue-600 shadow-lg shadow-blue-900/20"
                                : "border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.06]"
                            }`}
                          >
                            <p
                              className={`text-xs font-medium uppercase ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-slate-500"
                              }`}
                            >
                              {parts.weekday}
                            </p>

                            <p
                              className={`mt-1 text-2xl font-bold ${
                                isSelected
                                  ? "text-white"
                                  : "text-slate-200"
                              }`}
                            >
                              {parts.day}
                            </p>

                            <p
                              className={`mt-1 text-xs ${
                                isSelected
                                  ? "text-blue-100"
                                  : "text-slate-500"
                              }`}
                            >
                              {parts.month}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SELECTED DATE */}
                  {selectedDate && (
                    <motion.div
                      key={selectedDate}
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                    >
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">
                          Available Times
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatShowtimeDate(selectedDate)}
                        </p>
                      </div>

                      {selectedDateShowtimes.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                          <p className="text-sm text-slate-400">
                            No showtimes available for this
                            date.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {selectedDateShowtimes.map(
                            (showtime) => {
                              const isSelected =
                                selectedTime ===
                                showtime._id;

                              return (
                                <div
                                  key={showtime._id}
                                  className={`rounded-2xl border p-5 transition ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-500/[0.08]"
                                      : "border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleTimeSelect(
                                          showtime
                                        )
                                      }
                                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                                    >
                                      <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                                          isSelected
                                            ? "bg-blue-600"
                                            : "bg-blue-500/10"
                                        }`}
                                      >
                                        <FiClock
                                          className={
                                            isSelected
                                              ? "text-white"
                                              : "text-blue-400"
                                          }
                                        />
                                      </div>

                                      <div>
                                        <p className="text-xl font-bold text-white">
                                          {formatTime(
                                            showtime.startTime
                                          )}
                                        </p>

                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                          <FiMapPin />

                                          {showtime.hallId
                                            ?.name ||
                                            "Hall 1"}
                                        </div>
                                      </div>
                                    </button>

                                    {isSelected && (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                        <FiCheck className="text-sm text-white" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                                    <div>
                                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                                        Ticket
                                      </p>

                                      <p className="mt-1 font-bold text-white">
                                        ৳
                                        {Number(
                                          showtime.ticketPrice ||
                                            0
                                        ).toLocaleString()}
                                      </p>
                                    </div>

                                    <Link
                                      href={`/movie/${movie._id}/booking?showtimeId=${showtime._id}`}
                                      onClick={() =>
                                        handleTimeSelect(
                                          showtime
                                        )
                                      }
                                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                        isSelected
                                          ? "bg-blue-600 text-white hover:bg-blue-500"
                                          : "border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10"
                                      }`}
                                    >
                                      Book
                                      <FiArrowUpRight />
                                    </Link>
                                  </div>

                                  <div className="mt-3 text-xs text-slate-500">
                                    {showtime.hallId
                                      ?.capacity ||
                                      50}{" "}
                                    seats
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* MOVIE DETAILS */}
            <div className="mt-20">
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                  About the movie
                </p>

                <h2 className="text-3xl font-bold">
                  Movie Details
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* DIRECTOR */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Director
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {movie.director || "Not available"}
                    </p>
                  </div>

                  {/* DURATION */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Duration
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {formatDuration(movie.duration)}
                    </p>
                  </div>

                  {/* RELEASE DATE */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Release Date
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {formatReleaseDate(
                        movie.releaseDate
                      )}
                    </p>
                  </div>

                  {/* RATING */}
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Rating
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-white">
                      <FiStar className="text-yellow-400" />

                      {movie.rating
                        ? Number(movie.rating).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION */}
                {movie.description && (
                  <div className="mt-8 border-t border-white/10 pt-8">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Description
                    </p>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {movie.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CAST */}
            {movie.cast &&
              movie.cast.length > 0 && (
                <div className="mt-16">
                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                      Cast
                    </p>

                    <h2 className="text-3xl font-bold">
                      Cast & Crew
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {movie.cast.map(
                      (person, index) => (
                        <div
                          key={`${person}-${index}`}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                        >
                          {person}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {/* IMAGE */}
              <div className="relative aspect-video overflow-hidden">
                {movie.backdrop ? (
                  <img
                    src={movie.backdrop}
                    alt={movie.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                ) : movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-900">
                    <FiFilm className="text-4xl text-slate-600" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] to-transparent" />
              </div>

              {/* SIDEBAR INFO */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-blue-400">
                  <FiCheck />

                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Now showing
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold">
                  {movie.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Book your cinema seats and enjoy
                  the movie at The Checkpoint.
                </p>

                <a
                  href="#showtimes"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  <FiPocket />
                  Choose Showtime
                  <FiArrowUpRight />
                </a>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Cinema Hall
                    </span>

                    <span className="text-slate-300">
                      Hall 1
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Capacity
                    </span>

                    <span className="text-slate-300">
                      50 seats
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Showtimes
                    </span>

                    <span className="text-slate-300">
                      {showtimes.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* HIDE SCROLLBAR */}
      <style jsx global>{`
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  );
}