"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiCalendar,
  FiCheck,
  FiClock,
  FiFilm,
  FiPlay,
  FiPocket,
  FiStar,
  FiAlertCircle,
} from "react-icons/fi";

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "Duration unavailable";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining}m`;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const formatReleaseDate = (date) => {
  if (!date) return "Release date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function MovieDetailsPage() {
  const { movieId } = useParams();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!movieId) return;

    const controller = new AbortController();

    async function fetchMovie() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/movies/${movieId}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to fetch movie"
          );
        }

        setMovie(data.movie);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Movie fetch error:", err);
        setError(err.message || "Failed to load movie");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchMovie();

    return () => controller.abort();
  }, [movieId]);

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

  const bookingUrl = `/movie/${movie._id}/booking`;

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
            <div className="hidden lg:block">
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
            </div>

            {/* MOVIE INFO */}
            <div className="max-w-3xl">
              <Link
                href="/movie"
                className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <FiArrowLeft />
                Back to Movies
              </Link>

              {movie.genres?.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {movie.genres.map((genre, index) => (
                    <span
                      key={`${genre}-${index}`}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
                    >
                      {genre}
                    </span>
                  ))}
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

                <Link
                  href={bookingUrl}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                >
                  <FiPocket />
                  Book Now
                  <FiArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* LEFT CONTENT */}
          <div>
            {/* MOVIE DETAILS */}
            <div>
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
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Director
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {movie.director || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Duration
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {formatDuration(movie.duration)}
                    </p>
                  </div>

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
            {movie.cast?.length > 0 && (
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
                  {movie.cast.map((person, index) => (
                    <div
                      key={`${person}-${index}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                    >
                      {person}
                    </div>
                  ))}
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

                <Link
                  href={bookingUrl}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  <FiPocket />
                  Book Now
                  <FiArrowUpRight />
                </Link>

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
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}