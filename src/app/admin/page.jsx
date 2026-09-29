
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FiFilm,
  FiMonitor,
  FiClock,
  FiArrowUpRight,
  FiCalendar,
  FiRefreshCw,
  FiAlertCircle,
  FiActivity,
  FiCheckCircle,
} from "react-icons/fi";

const HALL_NAME = "Hall 1";
const HALL_CAPACITY = 50;
const HALL_ROWS = 5;
const SEATS_PER_ROW = 10;

/* =========================
   HELPERS
========================= */

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  if (!time) {
    return "--";
  }

  const [hours, minutes] =
    String(time).split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) {
    return "--";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* =========================
   DASHBOARD
========================= */

export default function AdminDashboard() {
  const [movies, setMovies] =
    useState([]);

  const [showtimes, setShowtimes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =========================
     FETCH DATA
  ========================= */

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          moviesResponse,
          showtimesResponse,
        ] = await Promise.all([
          fetch("/api/movies", {
            cache: "no-store",
          }),

          fetch("/api/showtimes", {
            cache: "no-store",
          }),
        ]);

        /* =========================
           PARSE MOVIES
        ========================= */

        let moviesData;

        try {
          moviesData =
            await moviesResponse.json();
        } catch {
          throw new Error(
            "Movies API returned an invalid response."
          );
        }

        /* =========================
           PARSE SHOWTIMES
        ========================= */

        let showtimesData;

        try {
          showtimesData =
            await showtimesResponse.json();
        } catch {
          throw new Error(
            "Showtimes API returned an invalid response."
          );
        }

        /* =========================
           MOVIES ERROR
        ========================= */

        if (
          !moviesResponse.ok ||
          !moviesData.success
        ) {
          throw new Error(
            moviesData.message ||
              `Unable to load movies. (${moviesResponse.status})`
          );
        }

        /* =========================
           SHOWTIMES ERROR
        ========================= */

        if (
          !showtimesResponse.ok ||
          !showtimesData.success
        ) {
          throw new Error(
            showtimesData.message ||
              `Unable to load showtimes. (${showtimesResponse.status})`
          );
        }

        /* =========================
           SET DATA
        ========================= */

        setMovies(
          Array.isArray(
            moviesData.movies
          )
            ? moviesData.movies
            : []
        );

        setShowtimes(
          Array.isArray(
            showtimesData.showtimes
          )
            ? showtimesData.showtimes
            : []
        );
      } catch (error) {
        console.error(
          "Dashboard fetch error:",
          error
        );

        setError(
          error?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const today = getToday();

  /* =========================
     TODAY SHOWS
  ========================= */

  const todayShowtimes = useMemo(() => {
    return showtimes
      .filter(
        (showtime) =>
          showtime.date === today
      )
      .sort((a, b) =>
        String(
          a.startTime
        ).localeCompare(
          String(b.startTime)
        )
      );
  }, [showtimes, today]);

  /* =========================
     UPCOMING SHOWS
  ========================= */

  const upcomingShows = useMemo(() => {
    return [...showtimes]
      .filter(
        (showtime) =>
          String(showtime.date) >=
          String(today)
      )
      .sort((a, b) => {
        const dateCompare =
          String(a.date).localeCompare(
            String(b.date)
          );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return String(
          a.startTime
        ).localeCompare(
          String(b.startTime)
        );
      })
      .slice(0, 5);
  }, [showtimes, today]);

  /* =========================
     STATS
  ========================= */

  const stats = [
    {
      title: "Total Movies",
      value: movies.length,
      description:
        movies.length === 1
          ? "1 movie available"
          : `${movies.length} movies available`,
      icon: FiFilm,
    },

    {
      title: "Cinema Hall",
      value: 1,
      description: `${HALL_CAPACITY} total seats`,
      icon: FiMonitor,
    },

    {
      title: "Today's Shows",
      value: todayShowtimes.length,
      description:
        todayShowtimes.length === 0
          ? "No shows scheduled today"
          : `${todayShowtimes.length} shows today`,
      icon: FiClock,
    },

    {
      title: "Total Shows",
      value: showtimes.length,
      description:
        showtimes.length === 0
          ? "No showtimes created"
          : `${showtimes.length} scheduled shows`,
      icon: FiCalendar,
    },
  ];

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* =========================
          HEADER
      ========================= */}

      <header className="border-b border-white/[0.07] bg-[#050A14]/80 backdrop-blur-xl">
        <div className="flex min-h-20 items-center justify-between gap-4 px-6 lg:px-10">
          <div className="pl-12 lg:pl-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">
              Overview
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() =>
                fetchDashboard(true)
              }
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-400 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                Administrator
              </p>

              <p className="text-xs text-slate-600">
                Cinema Management
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-sm font-bold text-blue-400">
              A
            </div>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}

      <main className="px-6 py-8 lg:px-10 lg:py-10">
        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4">
            <FiAlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-300">
                Dashboard data could not
                be loaded
              </p>

              <p className="mt-1 text-xs text-red-300/60">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchDashboard(true)
              }
              className="shrink-0 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* =========================
            INTRO
        ========================= */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-slate-500">
              Welcome back.
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight">
              Cinema Overview
            </h2>

            <p className="mt-2 text-xs text-slate-600">
              Live data from your cinema
              system
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FiActivity
              size={14}
              className="text-emerald-400"
            />

            System connected
          </div>
        </div>

        {/* =========================
            STATS
        ========================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group rounded-2xl border border-white/[0.07] bg-[#07101c]/70 p-5 transition hover:border-blue-500/20 hover:bg-[#07101c]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Icon size={19} />
                  </div>

                  <FiArrowUpRight
                    size={18}
                    className="text-slate-700 transition group-hover:text-blue-400"
                  />
                </div>

                <p className="mt-6 text-xs text-slate-500">
                  {stat.title}
                </p>

                <h3 className="mt-1 text-3xl font-black">
                  {stat.value}
                </h3>

                <p className="mt-2 text-[11px] text-slate-600">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* =========================
            HALL INFORMATION
        ========================= */}

        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#07101c]/70 p-5">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <FiMonitor size={20} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                  Cinema
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  {HALL_NAME}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-3 text-center">
                <p className="text-lg font-black text-white">
                  {HALL_CAPACITY}
                </p>

                <p className="text-[10px] text-slate-600">
                  Seats
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-3 text-center">
                <p className="text-lg font-black text-white">
                  {HALL_ROWS}
                </p>

                <p className="text-[10px] text-slate-600">
                  Rows
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-3 text-center">
                <p className="text-lg font-black text-white">
                  {SEATS_PER_ROW}
                </p>

                <p className="text-[10px] text-slate-600">
                  Per Row
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            CONTENT GRID
        ========================= */}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* =========================
              UPCOMING SHOWS
          ========================= */}

          <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#07101c]/70">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                  Schedule
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  Upcoming Shows
                </h3>
              </div>

              <Link
                href="/admin/showtimes"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-500/30 hover:text-white"
              >
                <FiCalendar size={13} />

                Manage
              </Link>
            </div>

            {upcomingShows.length ===
            0 ? (
              <EmptyState
                icon={FiClock}
                title="No upcoming shows"
                description="Create a showtime to see it here."
                href="/admin/showtimes"
                action="Create Showtime"
              />
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {upcomingShows.map(
                  (showtime) => (
                    <div
                      key={
                        showtime._id
                      }
                      className="flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-semibold text-white">
                            {showtime
                              .movieId
                              ?.title ||
                              "Unknown Movie"}
                          </h4>

                          {showtime.date ===
                            today && (
                            <span className="shrink-0 rounded-md bg-blue-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                              Today
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-slate-600">
                          {showtime
                            .hallId
                            ?.name ||
                            HALL_NAME}{" "}
                          ·{" "}
                          {formatDate(
                            showtime.date
                          )}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-700">
                          Ticket price: ৳
                          {Number(
                            showtime.ticketPrice ||
                              0
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-blue-400">
                          {formatTime(
                            showtime.startTime
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-600">
                          {HALL_CAPACITY}{" "}
                          seats
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* =========================
              QUICK ACTIONS
          ========================= */}

          <section className="rounded-2xl border border-white/[0.07] bg-[#07101c]/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
              Quick Actions
            </p>

            <h3 className="mt-1 text-lg font-bold">
              Manage Cinema
            </h3>

            <div className="mt-6 space-y-3">
              <QuickAction
                href="/admin/movies"
                icon={FiFilm}
                title="Manage Movies"
                description="Add or update movies"
              />

              <QuickAction
                href="/admin/showtimes"
                icon={FiClock}
                title="Manage Showtimes"
                description="Schedule cinema shows"
              />

              <QuickAction
                href="/admin/bookings"
                icon={FiCalendar}
                title="View Bookings"
                description="Manage customer bookings"
              />
            </div>

            {/* SYSTEM STATUS */}

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] px-4 py-3">
              <FiCheckCircle
                size={14}
                className="text-emerald-400"
              />

              <span className="text-[11px] text-slate-500">
                Movies and showtimes loaded
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================
   QUICK ACTION
========================= */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-blue-500/20 hover:bg-blue-500/[0.04]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-600">
          {description}
        </p>
      </div>

      <FiArrowUpRight
        size={16}
        className="text-slate-700 transition group-hover:text-blue-400"
      />
    </Link>
  );
}

/* =========================
   EMPTY STATE
========================= */

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-slate-600">
        <Icon size={20} />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-300">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs text-slate-600">
        {description}
      </p>

      {href && action && (
        <Link
          href={href}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

/* =========================
   LOADING SKELETON
========================= */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      <header className="h-20 border-b border-white/[0.07] bg-[#050A14]/80" />

      <main className="px-6 py-8 lg:px-10">
        <div className="mb-8">
          <div className="h-3 w-24 rounded bg-white/[0.06]" />

          <div className="mt-3 h-8 w-56 rounded bg-white/[0.06]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-40 rounded-2xl border border-white/[0.07] bg-[#07101c]/70"
              />
            )
          )}
        </div>

        <div className="mt-6 h-28 rounded-2xl border border-white/[0.07] bg-[#07101c]/70" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="h-[500px] rounded-2xl border border-white/[0.07] bg-[#07101c]/70" />

          <div className="h-[500px] rounded-2xl border border-white/[0.07] bg-[#07101c]/70" />
        </div>
      </main>
    </div>
  );
}

