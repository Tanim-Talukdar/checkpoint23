"use client";

import { useEffect, useState } from "react";

import {
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiCalendar,
  FiFilm,
  FiMonitor,
  FiUsers,
  FiRefreshCw,
} from "react-icons/fi";

export default function ShowtimesPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingShowtime, setEditingShowtime] =
    useState(null);

  const [deleteShowtime, setDeleteShowtime] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);


  const [form, setForm] = useState({
    movieId: "",
    date: "",
    startTime: "",
    ticketPrice: "",
  });


  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        showtimesResponse,
        moviesResponse,
      ] = await Promise.all([
        fetch("/api/showtimes", {
          cache: "no-store",
        }),

        fetch("/api/movies", {
          cache: "no-store",
        }),
      ]);


      const showtimesData =
        await showtimesResponse.json();

      const moviesData =
        await moviesResponse.json();


      if (
        !showtimesResponse.ok ||
        !showtimesData.success
      ) {
        throw new Error(
          showtimesData.message ||
            "Failed to load showtimes"
        );
      }


      if (
        !moviesResponse.ok ||
        !moviesData.success
      ) {
        throw new Error(
          moviesData.message ||
            "Failed to load movies"
        );
      }


      setShowtimes(
        showtimesData.showtimes || []
      );

      setMovies(
        moviesData.movies || []
      );
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };


  const openCreateForm = () => {
    setEditingShowtime(null);

    setForm({
      movieId: "",
      date: "",
      startTime: "",
      ticketPrice: "",
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  };


  const openEditForm = (showtime) => {
    setEditingShowtime(showtime);

    setForm({
      movieId:
        showtime.movieId?._id || "",

      date:
        showtime.date || "",

      startTime:
        showtime.startTime || "",

      ticketPrice:
        showtime.ticketPrice ??
        "",
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  };


  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingShowtime(null);
  };


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");


      if (!form.movieId) {
        throw new Error(
          "Please select a movie."
        );
      }

      if (!form.date) {
        throw new Error(
          "Please select a date."
        );
      }

      if (!form.startTime) {
        throw new Error(
          "Please select a start time."
        );
      }

      if (
        form.ticketPrice === "" ||
        Number(form.ticketPrice) < 0
      ) {
        throw new Error(
          "Please enter a valid ticket price."
        );
      }


      const payload = {
        movieId: form.movieId,

        date: form.date,

        startTime:
          form.startTime,

        ticketPrice:
          Number(form.ticketPrice),
      };


      const url = editingShowtime
        ? `/api/showtimes/${editingShowtime._id}`
        : "/api/showtimes";


      const method = editingShowtime
        ? "PUT"
        : "POST";


      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save showtime"
        );
      }


      if (editingShowtime) {
        setShowtimes(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                editingShowtime._id
                  ? data.showtime
                  : item
            )
        );

        setSuccess(
          "Showtime updated successfully."
        );
      } else {
        setShowtimes(
          (current) => [
            ...current,
            data.showtime,
          ]
        );

        setSuccess(
          "Showtime created successfully."
        );
      }


      setTimeout(() => {
        setShowForm(false);
        setEditingShowtime(null);
        setSuccess("");
      }, 700);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Failed to save showtime"
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteShowtime) {
      return;
    }

    try {
      setDeleting(true);
      setError("");


      const response =
        await fetch(
          `/api/showtimes/${deleteShowtime._id}`,
          {
            method: "DELETE",
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to delete showtime"
        );
      }


      setShowtimes(
        (current) =>
          current.filter(
            (item) =>
              item._id !==
              deleteShowtime._id
          )
      );


      setDeleteShowtime(null);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Failed to delete showtime"
      );
    } finally {
      setDeleting(false);
    }
  };


  const formatDate = (date) => {
    if (!date) return "-";

    const parsed =
      new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  const formatTime = (time) => {
    if (!time) return "-";

    const [
      hours,
      minutes,
    ] = time
      .split(":")
      .map(Number);

    const date =
      new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A14] text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-500">
            Loading showtimes...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#050A14] text-white">


      {/* HEADER */}

      <div className="border-b border-white/[0.07] bg-[#07101c]/60">
        <div className="px-5 py-7 sm:px-8 lg:px-10">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="mb-1 text-xs text-slate-500">
                Administration / Cinema
              </p>

              <h1 className="text-2xl font-semibold">
                Showtimes
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage movie schedules,
                times and ticket prices.
              </p>
            </div>


            <div className="flex gap-3">

              <button
                onClick={fetchData}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <FiRefreshCw />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>


              <button
                onClick={openCreateForm}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500"
              >
                <FiPlus />

                Add Showtime
              </button>

            </div>

          </div>

        </div>
      </div>


      {/* CONTENT */}

      <div className="px-5 py-8 sm:px-8 lg:px-10">

        <div className="mx-auto max-w-7xl">


          {/* ERROR */}

          {error && !showForm && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}


          {/* STATS */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatCard
              icon={<FiClock />}
              label="Total Shows"
              value={showtimes.length}
            />

            <StatCard
              icon={<FiFilm />}
              label="Movies Showing"
              value={
                new Set(
                  showtimes.map(
                    (show) =>
                      show.movieId?._id
                  )
                ).size
              }
            />

            <StatCard
              icon={<FiMonitor />}
              label="Cinema Hall"
              value="Hall 1"
            />

          </div>


          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101c]/70">

            <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">

              <h2 className="font-semibold">
                All Showtimes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {showtimes.length} scheduled{" "}
                {showtimes.length === 1
                  ? "show"
                  : "shows"}
              </p>

            </div>


            {showtimes.length === 0 ? (

              <div className="px-6 py-20 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <FiClock
                    size={24}
                  />
                </div>

                <h3 className="mt-5 font-medium">
                  No showtimes yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Create your first
                  movie showtime to
                  start selling tickets.
                </p>

                <button
                  onClick={
                    openCreateForm
                  }
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-500"
                >
                  Add Showtime
                </button>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-slate-500">

                      <th className="px-6 py-4 font-medium">
                        Movie
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Date
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Time
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Hall
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Seats
                      </th>

                      <th className="px-6 py-4 font-medium">
                        Price
                      </th>

                      <th className="px-6 py-4 text-right font-medium">
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {showtimes.map(
                      (showtime) => (

                        <tr
                          key={
                            showtime._id
                          }
                          className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]"
                        >

                          {/* MOVIE */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">

                                {showtime
                                  .movieId
                                  ?.poster ? (

                                  <img
                                    src={
                                      showtime
                                        .movieId
                                        .poster
                                    }
                                    alt={
                                      showtime
                                        .movieId
                                        .title
                                    }
                                    className="h-full w-full object-cover"
                                  />

                                ) : (

                                  <div className="flex h-full items-center justify-center text-slate-600">
                                    <FiFilm />
                                  </div>

                                )}

                              </div>


                              <div>

                                <p className="max-w-[220px] truncate text-sm font-medium text-white">
                                  {
                                    showtime
                                      .movieId
                                      ?.title
                                  }
                                </p>

                                {showtime
                                  .movieId
                                  ?.duration > 0 && (

                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      showtime
                                        .movieId
                                        .duration
                                    }{" "}
                                    min
                                  </p>

                                )}

                              </div>

                            </div>

                          </td>


                          {/* DATE */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2 text-sm text-slate-300">

                              <FiCalendar className="text-slate-500" />

                              {formatDate(
                                showtime.date
                              )}

                            </div>

                          </td>


                          {/* TIME */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2 text-sm font-medium text-white">

                              <FiClock className="text-blue-400" />

                              {formatTime(
                                showtime.startTime
                              )}

                            </div>

                          </td>


                          {/* HALL */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2">

                              <FiMonitor className="text-slate-500" />

                              <span className="text-sm text-slate-300">
                                {showtime
                                  .hallId
                                  ?.name ||
                                  "Hall 1"}
                              </span>

                            </div>

                          </td>


                          {/* SEATS */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2">

                              <FiUsers className="text-slate-500" />

                              <span className="text-sm text-slate-300">
                                {showtime
                                  .hallId
                                  ?.capacity ||
                                  50}
                              </span>

                            </div>

                          </td>


                          {/* PRICE */}

                          <td className="px-6 py-4">

                            <span className="text-sm font-semibold text-blue-400">
                              ৳
                              {
                                showtime.ticketPrice
                              }
                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td className="px-6 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  openEditForm(
                                    showtime
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                                title="Edit"
                              >
                                <FiEdit2
                                  size={15}
                                />
                              </button>


                              <button
                                onClick={() =>
                                  setDeleteShowtime(
                                    showtime
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete"
                              >
                                <FiTrash2
                                  size={15}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* CREATE / EDIT MODAL */}

      {showForm && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#07101c] shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold">
                  {editingShowtime
                    ? "Edit Showtime"
                    : "Add Showtime"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingShowtime
                    ? "Update the movie schedule."
                    : "Schedule a movie in Hall 1."}
                </p>

              </div>


              <button
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.05] hover:text-white"
              >
                <FiX />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* FORM ERROR */}

              {error && (

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>

              )}


              {/* SUCCESS */}

              {success && (

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
                  {success}
                </div>

              )}


              {/* MOVIE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Movie
                </label>

                <select
                  name="movieId"
                  value={form.movieId}
                  onChange={
                    handleChange
                  }
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                >

                  <option
                    value=""
                    className="bg-[#07101c]"
                  >
                    Select a movie
                  </option>

                  {movies.map(
                    (movie) => (

                      <option
                        key={
                          movie._id
                        }
                        value={
                          movie._id
                        }
                        className="bg-[#07101c]"
                      >
                        {movie.title}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* DATE + TIME */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      form.date
                    }
                    onChange={
                      handleChange
                    }
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 [color-scheme:dark]"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-4 text-sm text-white outline-none transition focus:border-blue-500/50 [color-scheme:dark]"
                  />

                </div>

              </div>


              {/* PRICE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Ticket Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    ৳
                  </span>

                  <input
                    type="number"
                    name="ticketPrice"
                    value={
                      form.ticketPrice
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="1"
                    placeholder="500"
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#050A14] pl-9 pr-4 text-sm text-white outline-none transition focus:border-blue-500/50"
                  />

                </div>

              </div>


              {/* HALL INFO */}

              <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    <FiMonitor />
                  </div>

                  <div>

                    <p className="text-sm font-medium text-white">
                      Hall 1
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This cinema has one
                      hall with 50 seats.
                      Hall 1 is automatically
                      assigned to this showtime.
                    </p>

                  </div>

                </div>

              </div>


              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="h-11 rounded-xl border border-white/[0.08] px-5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (

                    <>

                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Saving...

                    </>

                  ) : (

                    editingShowtime
                      ? "Update Showtime"
                      : "Create Showtime"

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* DELETE MODAL */}

      {deleteShowtime && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!deleting) {
              setDeleteShowtime(
                null
              );
            }
          }}
        >

          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#07101c] p-6 shadow-2xl"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <FiTrash2 />
            </div>


            <h2 className="mt-5 text-lg font-semibold">
              Delete showtime?
            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-400">

              Are you sure you want to
              delete the showtime for{" "}

              <span className="font-medium text-white">
                {
                  deleteShowtime
                    .movieId
                    ?.title
                }
              </span>{" "}

              on{" "}

              <span className="font-medium text-white">
                {formatDate(
                  deleteShowtime.date
                )}
              </span>{" "}

              at{" "}

              <span className="font-medium text-white">
                {formatTime(
                  deleteShowtime.startTime
                )}
              </span>
              ?

            </p>


            <div className="mt-6 flex gap-3">

              <button
                onClick={() =>
                  setDeleteShowtime(
                    null
                  )
                }
                disabled={deleting}
                className="h-11 flex-1 rounded-xl border border-white/[0.08] text-sm font-medium text-slate-300 hover:bg-white/[0.05] disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                onClick={
                  handleDelete
                }
                disabled={deleting}
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
              >

                {deleting ? (

                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>

                ) : (
                  "Delete"
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#07101c]/70 p-5">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>

        <div>

          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-lg font-semibold text-white">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}