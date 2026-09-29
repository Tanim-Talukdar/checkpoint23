
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiFilm,
  FiClock,
  FiStar,
  FiCalendar,
  FiX,
} from "react-icons/fi";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Custom delete modal
  const [deleteMovie, setDeleteMovie] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/movies", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch movies");
      }

      setMovies(data.movies || []);
    } catch (error) {
      console.error(error);
      setError(error.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return movies;

    return movies.filter((movie) => {
      const title = movie.title?.toLowerCase() || "";

      const genres = Array.isArray(movie.genres)
        ? movie.genres.join(" ").toLowerCase()
        : "";

      return title.includes(value) || genres.includes(value);
    });
  }, [movies, search]);

  const formatDuration = (minutes) => {
    if (!minutes) return "—";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;

    return `${hours}h ${mins}m`;
  };

  const handleDelete = async () => {
    if (!deleteMovie) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/movies/${deleteMovie._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete movie"
        );
      }

      setMovies((currentMovies) =>
        currentMovies.filter(
          (movie) => movie._id !== deleteMovie._id
        )
      );

      setDeleteMovie(null);
    } catch (error) {
      console.error(error);

      setError(
        error.message || "Failed to delete movie"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-white/[0.07] bg-[#07101c]/60">
        <div className="px-5 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <FiFilm />

                <span>Administration</span>

                <span>/</span>

                <span className="text-slate-400">
                  Movies
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Movies
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage movies available in your cinema.
              </p>
            </div>

            <Link
              href="/admin/movies/add"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
            >
              <FiPlus size={18} />

              Add Movie
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="px-5 py-6 sm:px-8 lg:px-10">
        {/* Search + Stats */}

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
          {/* Search */}

          <div className="relative">
            <FiSearch
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies..."
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#07101c] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
            />
          </div>

          <Stat
            icon={<FiFilm />}
            label="Total Movies"
            value={movies.length}
          />

          <Stat
            icon={<FiStar />}
            label="Rated"
            value={
              movies.filter(
                (movie) => movie.rating > 0
              ).length
            }
          />

          <Stat
            icon={<FiCalendar />}
            label="With Release Date"
            value={
              movies.filter(
                (movie) => movie.releaseDate?.trim()
              ).length
            }
          />
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-red-400 transition hover:text-red-300"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <LoadingState />
        ) : filteredMovies.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101c]/70">
            {/* =================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] text-left">
                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Movie
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Genre
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Duration
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                      Release
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMovies.map((movie) => (
                    <MovieRow
                      key={movie._id}
                      movie={movie}
                      formatDuration={formatDuration}
                      onDelete={() =>
                        setDeleteMovie(movie)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE
            ================================================== */}

            <div className="divide-y divide-white/[0.07] md:hidden">
              {filteredMovies.map((movie) => (
                <MovieMobileCard
                  key={movie._id}
                  movie={movie}
                  formatDuration={formatDuration}
                  onDelete={() =>
                    setDeleteMovie(movie)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          DELETE MODAL
      ====================================================== */}

      {deleteMovie && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteMovie(null);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101c] shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-start gap-4 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <FiTrash2 size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">
                  Delete movie?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-white">
                    {deleteMovie.title}
                  </span>
                  ?
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteMovie(null)}
                className="text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                <FiX size={19} />
              </button>
            </div>

            {/* Modal Footer */}

            <div className="flex justify-end gap-3 border-t border-white/[0.07] bg-white/[0.015] px-6 py-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteMovie(null)}
                className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={15} />

                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({ icon, label, value }) {
  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#07101c] px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <div>
        <p className="text-[11px] text-slate-500">
          {label}
        </p>

        <p className="text-lg font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP ROW
========================================================= */

function MovieRow({
  movie,
  formatDuration,
  onDelete,
}) {
  return (
    <tr className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-900">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-600">
                <FiFilm />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-white">
              {movie.title}
            </p>

            <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500">
              {movie.director
                ? `Directed by ${movie.director}`
                : "No director added"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex max-w-[220px] flex-wrap gap-1.5">
          {movie.genres?.length ? (
            movie.genres
              .slice(0, 3)
              .map((genre) => (
                <span
                  key={genre}
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-xs text-slate-400"
                >
                  {genre}
                </span>
              ))
          ) : (
            <span className="text-sm text-slate-600">
              —
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FiClock size={14} />

          {formatDuration(movie.duration)}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-sm">
          <FiStar
            className="text-yellow-400"
            size={14}
          />

          <span>
            {movie.rating > 0
              ? movie.rating.toFixed(1)
              : "—"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 text-sm text-slate-400">
        {movie.releaseDate || "—"}
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/movies/${movie._id}/edit`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
            title="Edit movie"
          >
            <FiEdit2 size={15} />
          </Link>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
            title="Delete movie"
          >
            <FiTrash2 size={15} />
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            title="More"
          >
            <FiMoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function MovieMobileCard({
  movie,
  formatDuration,
  onDelete,
}) {
  return (
    <div className="p-4">
      <div className="flex gap-4">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900">
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">
              <FiFilm />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium">
                {movie.title}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {movie.director ||
                  "No director added"}
              </p>
            </div>

            <span className="flex items-center gap-1 text-xs text-slate-400">
              <FiStar className="text-yellow-400" />

              {movie.rating > 0
                ? movie.rating.toFixed(1)
                : "—"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {movie.genres
              ?.slice(0, 2)
              .map((genre) => (
                <span
                  key={genre}
                  className="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400"
                >
                  {genre}
                </span>
              ))}

            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <FiClock />

              {formatDuration(movie.duration)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/movies/${movie._id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.08] py-2.5 text-xs text-slate-300 transition hover:bg-white/[0.04]"
        >
          <FiEdit2 />

          Edit
        </Link>

        <button
          type="button"
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/10 py-2.5 text-xs text-red-400 transition hover:bg-red-500/10"
        >
          <FiTrash2 />

          Delete
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-10">
      <div className="flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

        <p className="mt-4 text-sm text-slate-500">
          Loading movies...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({ search }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
        <FiFilm size={24} />
      </div>

      <h2 className="mt-5 text-lg font-medium">
        {search
          ? "No movies found"
          : "No movies yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {search
          ? "Try searching with a different movie title or genre."
          : "Add your first movie to start managing your cinema collection."}
      </p>

      {!search && (
        <Link
          href="/admin/movies/add"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500"
        >
          <FiPlus />

          Add Movie
        </Link>
      )}
    </div>
  );
}
