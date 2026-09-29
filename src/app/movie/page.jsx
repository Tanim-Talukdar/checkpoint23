"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiStar,
  FiPlay,
  FiArrowUpRight,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  "All",
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Adventure",
  "Crime",
];

/* =========================================================
   HELPERS
========================================================= */

function formatDuration(minutes) {
  if (!minutes) return "";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/* =========================================================
   PAGE
========================================================= */

export default function MoviePage() {
  const [movies, setMovies] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [activeMovie, setActiveMovie] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     FETCH MOVIES
  ======================================================= */

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/movies", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch movies"
          );
        }

        setMovies(data.movies || []);
      } catch (error) {
        console.error("Movie fetch error:", error);

        setError("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  /* =======================================================
     KEEP ACTIVE MOVIE VALID
  ======================================================= */

  useEffect(() => {
    if (activeMovie >= movies.length) {
      setActiveMovie(0);
    }
  }, [movies.length, activeMovie]);

  /* =======================================================
     AUTO SLIDER
  ======================================================= */

  useEffect(() => {
    if (movies.length <= 1) return;

    const timer = setInterval(() => {
      setActiveMovie((current) => {
        return (current + 1) % movies.length;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [movies.length]);

  /* =======================================================
     FEATURED MOVIE
  ======================================================= */

  const featuredMovie = movies[activeMovie];

  /* =======================================================
     FILTER MOVIES
  ======================================================= */

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const searchMatch = movie.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const categoryMatch =
        category === "All" ||
        movie.genres?.includes(category);

      return searchMatch && categoryMatch;
    });
  }, [movies, search, category]);

  /* =======================================================
     NEXT / PREVIOUS
  ======================================================= */

  const nextMovie = () => {
    if (!movies.length) return;

    setActiveMovie((current) => {
      return (current + 1) % movies.length;
    });
  };

  const previousMovie = () => {
    if (!movies.length) return;

    setActiveMovie((current) => {
      return (
        (current - 1 + movies.length) %
        movies.length
      );
    });
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050A14] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="mt-5 text-sm text-slate-500">
            Loading movies...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050A14] px-6 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Unable to load movies
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold transition hover:bg-blue-500"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050A14] text-white">
      {/* =====================================================
          PREMIUM HERO CAROUSEL
      ====================================================== */}

      {featuredMovie ? (
        <section className="relative min-h-[760px] overflow-hidden bg-[#050A14]">
          {/* =================================================
              BACKGROUND
          ================================================== */}

          <AnimatePresence mode="wait">
            <motion.div
              key={featuredMovie._id}
              initial={{
                opacity: 0,
                scale: 1.08,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 1.03,
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${featuredMovie.backdrop || featuredMovie.poster})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </AnimatePresence>

          {/* Dark overlay */}

          <div className="absolute inset-0 bg-[#050A14]/45" />

          {/* Left gradient */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#050A14] via-[#050A14]/80 to-[#050A14]/10" />

          {/* Bottom gradient */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/20 to-transparent" />

          {/* Blue glow */}

          <div className="pointer-events-none absolute -right-40 top-10 h-[550px] w-[550px] rounded-full bg-blue-600/10 blur-[150px]" />

          {/* =================================================
              HERO CONTENT
          ================================================== */}

          <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-end px-6 pb-20 pt-32 sm:px-8 lg:px-10">
            <div className="flex w-full items-end justify-between gap-10">
              {/* =================================================
                  LEFT
              ================================================== */}

              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredMovie._id}
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -20,
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                  className="max-w-3xl"
                >
                  {/* Label */}

                  <div className="mb-6 flex items-center gap-3">
                    <span className="h-px w-10 bg-blue-500" />

                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-400">
                      The Checkpoint Cinema
                    </span>
                  </div>

                  {/* Now showing */}

                  <p className="mb-3 text-xs font-medium tracking-[0.3em] text-slate-500">
                    NOW SHOWING
                  </p>

                  {/* Title */}

                  <h1 className="max-w-3xl text-6xl font-black leading-[0.88] tracking-[-0.06em] text-white sm:text-7xl lg:text-[92px]">
                    {featuredMovie.title}
                  </h1>

                  {/* Description */}

                  <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                    {featuredMovie.description}
                  </p>

                  {/* Meta */}

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    {/* Rating */}

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 backdrop-blur-xl">
                      <FiStar className="fill-current text-yellow-400" />

                      <span className="text-sm font-semibold">
                        {featuredMovie.rating}
                      </span>
                    </div>

                    {/* Genres */}

                    {featuredMovie.genres?.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl"
                      >
                        {genre}
                      </span>
                    ))}

                    {/* Duration */}

                    {featuredMovie.duration > 0 && (
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 backdrop-blur-xl">
                        <FiClock size={14} />

                        {formatDuration(
                          featuredMovie.duration
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      BUTTONS
                  ================================================== */}

                  <div className="mt-9 flex flex-wrap gap-4">
                    {/* Book */}

                    <Link
                      href={`/movie/${featuredMovie._id}`}
                      className="group flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,0.35)]"
                    >
                      Book Now

                      <FiArrowUpRight
                        size={18}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </Link>

                    {/* Trailer */}

                    {featuredMovie.trailer && (
                      <a
                        href={featuredMovie.trailer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/10"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#050A14]">
                          <FiPlay
                            size={12}
                            fill="currentColor"
                          />
                        </span>

                        Watch Trailer
                      </a>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* =================================================
              SLIDER CONTROLS
          ================================================== */}

          {movies.length > 1 && (
            <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 sm:left-8 sm:translate-x-0 lg:left-10">
              {/* Previous */}

              <button
                onClick={previousMovie}
                aria-label="Previous movie"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#050A14]/60 text-slate-300 backdrop-blur-xl transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white sm:h-10 sm:w-10"
              >
                <FiChevronLeft size={16} />
              </button>

              {/* Indicators */}

              <div className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-[#050A14]/60 px-3 backdrop-blur-xl sm:h-10 sm:px-4">
                {movies.map((movie, index) => (
                  <button
                    key={movie._id}
                    onClick={() =>
                      setActiveMovie(index)
                    }
                    aria-label={`Show ${movie.title}`}
                    className={`rounded-full transition-all duration-500 ${
                      index === activeMovie
                        ? "h-1.5 w-7 bg-blue-500"
                        : "h-1.5 w-1.5 bg-white/25 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              {/* Next */}

              <button
                onClick={nextMovie}
                aria-label="Next movie"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#050A14]/60 text-slate-300 backdrop-blur-xl transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white sm:h-10 sm:w-10"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Bottom fade */}

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050A14] to-transparent" />
        </section>
      ) : (
        /* =====================================================
           EMPTY HERO
        ====================================================== */

        <section className="flex min-h-[500px] items-center justify-center bg-[#050A14] px-6">
          <div className="text-center">
            <h1 className="text-4xl font-black">
              No movies available
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Movies added from the admin panel will appear here.
            </p>
          </div>
        </section>
      )}

      {/* =====================================================
          MOVIES SECTION
      ====================================================== */}

      <section
        id="movies"
        className="border-t border-white/[0.06] bg-[#07101c]/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
          {/* =================================================
              SECTION HEADER
          ================================================== */}

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                Explore
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Movies
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Find something worth watching tonight.
              </p>
            </div>

            {/* Search */}

            <div className="relative w-full lg:w-80">
              <FiSearch
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search movies..."
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          {/* =================================================
              CATEGORY FILTER
          ================================================== */}

            <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setCategory(item)
                  }
                  className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "border border-white/10 bg-white/[0.02] text-slate-500 hover:border-blue-500/30 hover:bg-blue-500/[0.05] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* =================================================
              RESULT COUNT
          ================================================== */}

          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Showing{" "}
              <span className="text-slate-400">
                {filteredMovies.length}
              </span>{" "}
              movies
            </p>

            {(search || category !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="text-xs font-medium text-blue-500 transition hover:text-blue-400"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* =================================================
              MOVIE GRID
          ================================================== */}

          {filteredMovies.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredMovies.map(
                (movie, index) => (
                  <motion.article
                    key={movie._id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                    }}
                    className="group"
                  >
                    {/* Poster */}

                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-white/[0.03]">
                          <span className="text-xs text-slate-600">
                            No poster
                          </span>
                        </div>
                      )}

                      {/* Overlay */}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-transparent opacity-60" />

                      {/* Rating */}

                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-white/10 bg-[#050A14]/80 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                        <FiStar
                          className="fill-current text-blue-400"
                          size={12}
                        />

                        {movie.rating}
                      </div>

                      {/* Hover */}

                      <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Link
                          href={`/movie/${movie._id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold shadow-xl shadow-blue-600/20 transition hover:bg-blue-500"
                        >
                          View Movie

                          <FiArrowUpRight
                            size={14}
                          />
                        </Link>
                      </div>
                    </div>

                    {/* Details */}

                    <div className="mt-4">
                      <h3 className="truncate text-sm font-bold text-white">
                        {movie.title}
                      </h3>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-slate-600">
                          {movie.genres
                            ?.slice(0, 2)
                            .join(" • ")}
                        </p>

                        {movie.duration > 0 && (
                          <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-600">
                            <FiClock size={11} />

                            {formatDuration(
                              movie.duration
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.article>
                )
              )}
            </div>
          ) : (
            /* =================================================
               NO RESULTS
            ================================================== */

            <div className="mt-10 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <FiSearch size={22} />
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No movies found
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Try another movie or category.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold transition hover:bg-blue-500"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}