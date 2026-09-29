
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiPlus,
  FiFilm,
  FiSave,
} from "react-icons/fi";

export default function AddMoviePage() {
  const router = useRouter();

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

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB.");
      return;
    }

    setError("");

    const preview = URL.createObjectURL(file);

    if (type === "poster") {
      setPoster(file);
      setPosterPreview(preview);
    } else {
      setBackdrop(file);
      setBackdropPreview(preview);
    }
  };

  const removeImage = (type) => {
    if (type === "poster") {
      setPoster(null);
      setPosterPreview("");
    } else {
      setBackdrop(null);
      setBackdropPreview("");
    }
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
      throw new Error(data.message || "Image upload failed");
    }

    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError("Movie title is required.");
      return;
    }

    if (!poster) {
      setError("Movie poster is required.");
      return;
    }

    try {
      setSaving(true);
      setUploading(true);

      // Upload poster
      const posterUrl = await uploadImage(poster);

      // Upload backdrop if provided
      let backdropUrl = "";

      if (backdrop) {
        backdropUrl = await uploadImage(backdrop);
      }

      setUploading(false);

      const movieData = {
        title: form.title.trim(),

        poster: posterUrl,

        backdrop: backdropUrl,

        description: form.description.trim(),

        genres: form.genres
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean),

        rating: form.rating ? Number(form.rating) : 0,

        duration: form.duration ? Number(form.duration) : 0,

        releaseDate: form.releaseDate,

        trailer: form.trailer.trim(),

        director: form.director.trim(),

        cast: form.cast
          .split(",")
          .map((person) => person.trim())
          .filter(Boolean),
      };

      const response = await fetch("/api/movies", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(movieData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create movie");
      }

      router.push("/admin/movies");
      router.refresh();
    } catch (error) {
      console.error(error);

      setUploading(false);

      setError(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* Header */}

      <div className="border-b border-white/[0.07] bg-[#07101c]/60">
        <div className="px-5 py-6 sm:px-8 lg:px-10">
          <Link
            href="/admin/movies"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <FiArrowLeft />
            Back to Movies
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <FiFilm size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Add Movie
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Add a new movie to your cinema.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}

      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Main Information */}

            <div className="space-y-6">
              <Section title="Movie Information">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Movie Title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Interstellar"
                    required
                  />

                  <Input
                    label="Director"
                    name="director"
                    value={form.director}
                    onChange={handleChange}
                    placeholder="e.g. Christopher Nolan"
                  />

                  <Input
                    label="Duration"
                    name="duration"
                    type="number"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="Minutes"
                    min="0"
                  />

                  <Input
                    label="Rating"
                    name="rating"
                    type="number"
                    value={form.rating}
                    onChange={handleChange}
                    placeholder="0 - 10"
                    min="0"
                    max="10"
                    step="0.1"
                  />

                  <Input
                    label="Release Date"
                    name="releaseDate"
                    type="date"
                    value={form.releaseDate}
                    onChange={handleChange}
                  />

                  <Input
                    label="Trailer URL"
                    name="trailer"
                    value={form.trailer}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="mt-5">
                  <Input
                    label="Genres"
                    name="genres"
                    value={form.genres}
                    onChange={handleChange}
                    placeholder="Action, Sci-Fi, Drama"
                    hint="Separate multiple genres with commas."
                  />
                </div>

                <div className="mt-5">
                  <Input
                    label="Cast"
                    name="cast"
                    value={form.cast}
                    onChange={handleChange}
                    placeholder="Actor 1, Actor 2, Actor 3"
                    hint="Separate cast members with commas."
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Write a short description of the movie..."
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#050A14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
                  />
                </div>
              </Section>

              {/* Images */}

              <Section title="Movie Images">
                <div className="grid gap-6 md:grid-cols-2">
                  <ImageUpload
                    label="Poster"
                    description="Recommended: 2:3 portrait"
                    preview={posterPreview}
                    onChange={(e) => handleImageChange(e, "poster")}
                    onRemove={() => removeImage("poster")}
                    required
                  />

                  <ImageUpload
                    label="Backdrop"
                    description="Recommended: 16:9 landscape"
                    preview={backdropPreview}
                    onChange={(e) => handleImageChange(e, "backdrop")}
                    onRemove={() => removeImage("backdrop")}
                  />
                </div>
              </Section>
            </div>

            {/* Side */}

            <div>
              <div className="sticky top-6 space-y-6">
                <Section title="Preview">
                  <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#050A14]">
                    <div className="aspect-[2/3] overflow-hidden">
                      {posterPreview ? (
                        <img
                          src={posterPreview}
                          alt="Movie poster preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-slate-600">
                          <FiFilm size={30} />

                          <p className="mt-3 text-xs">
                            Poster preview
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium">
                        {form.title || "Movie Title"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.genres
                          .split(",")
                          .map((genre) => genre.trim())
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((genre) => (
                            <span
                              key={genre}
                              className="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400"
                            >
                              {genre}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </Section>

                <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-5">
                  <p className="text-sm font-medium text-blue-400">
                    Before saving
                  </p>

                  <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">
                    <li>• Make sure the movie title is correct.</li>
                    <li>• Use a high-quality poster.</li>
                    <li>• Duration should be entered in minutes.</li>
                    <li>• Separate genres and cast members with commas.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/admin/movies"
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.08] px-6 py-3 text-sm text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
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

                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <FiSave size={17} />
                  Save Movie
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5 sm:p-6">
      <h2 className="mb-6 text-base font-medium">{title}</h2>

      {children}
    </section>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  hint,
  required,
  ...props
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-red-400">*</span>
        )}
      </label>

      <input
        {...props}
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
      />

      {hint && (
        <p className="mt-1.5 text-[11px] text-slate-600">
          {hint}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

function ImageUpload({
  label,
  description,
  preview,
  onChange,
  onRemove,
  required,
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-medium text-slate-300">
          {label}

          {required && (
            <span className="ml-1 text-red-400">*</span>
          )}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
          <img
            src={preview}
            alt={`${label} preview`}
            className="max-h-[360px] w-full object-cover"
          />

          <button
            type="button"
            onClick={onRemove}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur transition hover:bg-red-500"
          >
            <FiX />
          </button>
        </div>
      ) : (
        <label className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-[#050A14] transition hover:border-blue-500/40 hover:bg-blue-500/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-slate-500 transition group-hover:bg-blue-500/10 group-hover:text-blue-400">
            <FiUpload size={20} />
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Click to upload
          </p>

          <p className="mt-1 text-xs text-slate-600">
            PNG, JPG, WEBP
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
