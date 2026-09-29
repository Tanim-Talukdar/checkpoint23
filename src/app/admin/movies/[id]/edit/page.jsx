"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiFilm,
  FiSave,
  FiImage,
  FiCheckCircle,
} from "react-icons/fi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function EditMoviePage() {
  const params = useParams();
  const router = useRouter();

  const movieId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    genres: "",
    rating: "",
    duration: "",
    releaseDate: "",
    trailer: "",
    director: "",
    cast: "",
  });

  const [poster, setPoster] = useState(null);
  const [backdrop, setBackdrop] = useState(null);

  const [posterPreview, setPosterPreview] = useState("");
  const [backdropPreview, setBackdropPreview] = useState("");

  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] =
    useState(false);

  useEffect(() => {
    if (movieId) {
      fetchMovie();
    }
  }, [movieId]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/movies/${movieId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch movie"
        );
      }

      const movie = data.movie;

      setForm({
        title: movie.title || "",
        description: movie.description || "",
        genres: Array.isArray(movie.genres)
          ? movie.genres.join(", ")
          : "",
        rating:
          movie.rating !== undefined &&
          movie.rating !== null
            ? String(movie.rating)
            : "",
        duration:
          movie.duration !== undefined &&
          movie.duration !== null
            ? String(movie.duration)
            : "",
        releaseDate: movie.releaseDate || "",
        trailer: movie.trailer || "",
        director: movie.director || "",
        cast: Array.isArray(movie.cast)
          ? movie.cast.join(", ")
          : "",
      });

      setPosterPreview(movie.poster || "");
      setBackdropPreview(movie.backdrop || "");
    } catch (error) {
      console.error(error);
      setError(
        error.message || "Failed to load movie"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateImage = (file) => {
    if (!file) return false;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 10MB.");
      return false;
    }

    return true;
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateImage(file)) {
      e.target.value = "";
      return;
    }

    setError("");
    setPoster(file);

    const preview = URL.createObjectURL(file);
    setPosterPreview(preview);
  };

  const handleBackdropChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateImage(file)) {
      e.target.value = "";
      return;
    }

    setError("");
    setBackdrop(file);

    const preview = URL.createObjectURL(file);
    setBackdropPreview(preview);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Image upload failed"
      );
    }

    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.title.trim()) {
        throw new Error("Movie title is required.");
      }

      let posterUrl = posterPreview;
      let backdropUrl = backdropPreview;

      // Upload new poster
      if (poster) {
        setUploadingPoster(true);

        posterUrl = await uploadImage(poster);

        setUploadingPoster(false);
      }

      // Upload new backdrop
      if (backdrop) {
        setUploadingBackdrop(true);

        backdropUrl = await uploadImage(backdrop);

        setUploadingBackdrop(false);
      }

      const movieData = {
        title: form.title.trim(),

        poster: posterUrl || "",

        backdrop: backdropUrl || "",

        description: form.description.trim(),

        genres: form.genres
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        rating: form.rating
          ? Number(form.rating)
          : 0,

        duration: form.duration
          ? Number(form.duration)
          : 0,

        releaseDate: form.releaseDate,

        trailer: form.trailer.trim(),

        director: form.director.trim(),

        cast: form.cast
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch(
        `/api/movies/${movieId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(movieData),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update movie"
        );
      }

      setSuccess("Movie updated successfully.");

      setTimeout(() => {
        router.push("/admin/movies");
      }, 700);
    } catch (error) {
      console.error(error);

      setUploadingPoster(false);
      setUploadingBackdrop(false);

      setError(
        error.message || "Failed to update movie"
      );
    } finally {
      setSaving(false);
    }
  };

  const removePoster = () => {
    setPoster(null);
    setPosterPreview("");
  };

  const removeBackdrop = () => {
    setBackdrop(null);
    setBackdropPreview("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A14] text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-500">
            Loading movie...
          </p>
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
              href="/admin/movies"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <FiArrowLeft />
            </Link>

            <div>
              <div className="mb-1 text-xs text-slate-500">
                Administration / Movies / Edit
              </div>

              <h1 className="text-2xl font-semibold">
                Edit Movie
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Update movie information and images.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-6xl"
        >
          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
              <FiCheckCircle />

              {success}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* =================================================
                LEFT
            ================================================== */}

            <div className="space-y-6">
              {/* BASIC INFORMATION */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="font-semibold">
                    Basic Information
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Main information about the movie.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* TITLE */}

                  <Field label="Movie Title" required>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Enter movie title"
                      className="input"
                      required
                    />
                  </Field>

                  {/* DESCRIPTION */}

                  <Field label="Description">
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Write a short description..."
                      rows={5}
                      className="input resize-none"
                    />
                  </Field>

                  {/* GENRES */}

                  <Field
                    label="Genres"
                    hint="Separate genres with commas"
                  >
                    <input
                      name="genres"
                      value={form.genres}
                      onChange={handleChange}
                      placeholder="Action, Drama, Sci-Fi"
                      className="input"
                    />
                  </Field>

                  {/* DIRECTOR */}

                  <Field label="Director">
                    <input
                      name="director"
                      value={form.director}
                      onChange={handleChange}
                      placeholder="Director name"
                      className="input"
                    />
                  </Field>

                  {/* CAST */}

                  <Field
                    label="Cast"
                    hint="Separate names with commas"
                  >
                    <input
                      name="cast"
                      value={form.cast}
                      onChange={handleChange}
                      placeholder="Actor 1, Actor 2, Actor 3"
                      className="input"
                    />
                  </Field>
                </div>
              </section>

              {/* MOVIE DETAILS */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="font-semibold">
                    Movie Details
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Runtime, rating and release information.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Rating" hint="0 - 10">
                    <input
                      name="rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={form.rating}
                      onChange={handleChange}
                      placeholder="8.5"
                      className="input"
                    />
                  </Field>

                  <Field
                    label="Duration"
                    hint="Minutes"
                  >
                    <input
                      name="duration"
                      type="number"
                      min="0"
                      value={form.duration}
                      onChange={handleChange}
                      placeholder="150"
                      className="input"
                    />
                  </Field>

                  <Field label="Release Date">
                    <input
                      name="releaseDate"
                      type="date"
                      value={form.releaseDate}
                      onChange={handleChange}
                      className="input"
                    />
                  </Field>
                </div>

                <div className="mt-5">
                  <Field
                    label="Trailer URL"
                    hint="YouTube or other video URL"
                  >
                    <input
                      name="trailer"
                      value={form.trailer}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="input"
                    />
                  </Field>
                </div>
              </section>

              {/* IMAGES */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="font-semibold">
                    Movie Images
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Replace the current poster or backdrop if needed.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* POSTER */}

                  <ImageUpload
                    label="Poster"
                    preview={posterPreview}
                    onChange={handlePosterChange}
                    onRemove={removePoster}
                    uploading={uploadingPoster}
                    aspect="poster"
                    inputId="poster-upload"
                  />

                  {/* BACKDROP */}

                  <ImageUpload
                    label="Backdrop"
                    preview={backdropPreview}
                    onChange={handleBackdropChange}
                    onRemove={removeBackdrop}
                    uploading={uploadingBackdrop}
                    aspect="backdrop"
                    inputId="backdrop-upload"
                  />
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT PREVIEW
            ================================================== */}

            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101c]/70">
                <div className="border-b border-white/[0.07] px-5 py-4">
                  <h2 className="font-semibold">
                    Preview
                  </h2>
                </div>

                {/* BACKDROP */}

                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  {backdropPreview ? (
                    <img
                      src={backdropPreview}
                      alt="Movie backdrop"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-700">
                      <FiImage size={30} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101c] via-transparent to-transparent" />
                </div>

                {/* POSTER + INFO */}

                <div className="-mt-16 relative px-5 pb-6">
                  <div className="flex items-end gap-4">
                    <div className="h-32 w-[86px] shrink-0 overflow-hidden rounded-xl border-2 border-[#07101c] bg-slate-900 shadow-xl">
                      {posterPreview ? (
                        <img
                          src={posterPreview}
                          alt={form.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-700">
                          <FiFilm size={22} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 pb-1">
                      <h3 className="line-clamp-2 text-lg font-semibold">
                        {form.title || "Movie Title"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {form.releaseDate ||
                          "Release date"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {form.genres
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((genre) => (
                        <span
                          key={genre}
                          className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-400"
                        >
                          {genre}
                        </span>
                      ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <PreviewStat
                      label="Rating"
                      value={
                        form.rating
                          ? `${form.rating}/10`
                          : "—"
                      }
                    />

                    <PreviewStat
                      label="Duration"
                      value={
                        form.duration
                          ? `${form.duration} min`
                          : "—"
                      }
                    />
                  </div>

                  {form.description && (
                    <p className="mt-5 line-clamp-4 text-xs leading-5 text-slate-500">
                      {form.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/admin/movies"
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] px-6 py-3 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  {uploadingPoster || uploadingBackdrop
                    ? "Uploading..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  <FiSave size={17} />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* GLOBAL INPUT STYLE */}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #050a14;
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .input::placeholder {
          color: rgb(71 85 105);
        }

        .input:focus {
          border-color: rgba(59, 130, 246, 0.5);
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  hint,
  required,
  children,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">
          {label}

          {required && (
            <span className="ml-1 text-blue-400">
              *
            </span>
          )}
        </label>

        {hint && (
          <span className="text-[11px] text-slate-600">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

function ImageUpload({
  label,
  preview,
  onChange,
  onRemove,
  uploading,
  aspect,
  inputId,
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-300">
        {label}
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border border-dashed border-white/[0.12] bg-[#050A14] ${
          aspect === "poster"
            ? "aspect-[2/3]"
            : "aspect-video"
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
              <label
                htmlFor={inputId}
                className="cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-xs text-white backdrop-blur transition hover:bg-white/20"
              >
                Replace
              </label>

              <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300 backdrop-blur transition hover:bg-red-500/30"
              >
                <FiX />

                Remove
              </button>
            </div>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="flex h-full cursor-pointer flex-col items-center justify-center px-4 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FiUpload size={20} />
            </div>

            <p className="mt-3 text-sm text-slate-300">
              Upload {label.toLowerCase()}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              PNG, JPG, WEBP · Max 10MB
            </p>
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-blue-500" />

              <p className="mt-2 text-xs text-slate-300">
                Uploading...
              </p>
            </div>
          </div>
        )}

        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

/* =========================================================
   PREVIEW STAT
========================================================= */

function PreviewStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}