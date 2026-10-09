
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiActivity,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiUsers,
  FiVideo,
  FiWind,
} from "react-icons/fi";

const TIME_ZONE = "Asia/Dhaka";

const FACILITY_ICONS = {
  gym: FiActivity,
  "swimming-pool": FiUsers,
  "gym-pool": FiActivity,
  "steam-bath": FiWind,
  playground: FiActivity,
  "private-movie": FiVideo,
};

const FACILITY_TYPES = {
  fitness: "Fitness",
  steam: "Wellness",
  playground: "Sports",
  movie: "Entertainment",
};

const EMPTY_DATA = {
  stats: {
    todayBookings: 0,
    todayRevenue: 0,
    todayPayments: 0,
    confirmedBookings: 0,
    upcomingBookings: 0,
    activeMemberships: 0,
    averageOccupancy: 0,
  },
  facilities: [],
  todaySchedule: [],
};

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function timeToMinutes(time) {
  if (typeof time !== "string") return null;

  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function formatTime(time) {
  const minutes = timeToMinutes(time);

  if (minutes === null) return time || "—";

  const hours = Math.floor(minutes / 60);
  const minutePart = String(minutes % 60).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${minutePart} ${period}`;
}

function formatMoney(value) {
  return `৳${(Number(value) || 0).toLocaleString("en-BD")}`;
}

function getStatusClasses(status) {
  switch (status) {
    case "Full":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Limited":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Booked":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Confirmed":
    case "Paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Completed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Cancelled":
    case "Failed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/[0.03] text-white/50";
  }
}

function getFacilityTypeLabel(facility) {
  return (
    FACILITY_TYPES[facility?.facilityType] ||
    facility?.type ||
    "Facility"
  );
}

function getCurrentSlot(facility) {
  return facility?.currentSlot || facility?.slot || null;
}

function getOccupancy(facility) {
  const slot = getCurrentSlot(facility);

  if (!slot) {
    return {
      active: false,
      booked: 0,
      capacity: 0,
      percentage: 0,
      status: "Not in session",
      time: "",
    };
  }

  const startTime = slot.startTime || slot.start;
  const endTime = slot.endTime || slot.end;
  const booked = Math.max(
    0,
    Number(slot.booked ?? slot.bookedQuantity) || 0
  );
  const capacity = Math.max(0, Number(slot.capacity) || 0);

  const rawPercentage =
    slot.percentage ??
    slot.occupancy ??
    (capacity ? (booked / capacity) * 100 : 0);

  const percentage = Math.min(
    100,
    Math.max(0, Math.round(Number(rawPercentage) || 0))
  );

  let status = slot.status;

  if (!status) {
    if (!capacity) status = "Not in session";
    else if (booked >= capacity) status = "Full";
    else if (booked / capacity >= 0.75) status = "Limited";
    else status = "Available";
  }

  return {
    active: Boolean(startTime && endTime && capacity > 0),
    booked,
    capacity,
    percentage,
    status,
    time: `${formatTime(startTime)} – ${formatTime(endTime)}`,
  };
}

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="group rounded-2xl border border-white/10 bg-[#07101D] p-5 transition-colors hover:border-blue-400/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {item.label}
          </p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {item.value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-400">
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="font-medium text-blue-400">{item.change}</span>
        <span className="text-white/35">{item.description}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-white/40">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(EMPTY_DATA);
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/dashboard", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          `Invalid dashboard response (${response.status}). Check /api/dashboard.`
        );
      }

      if (!response.ok || !result?.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "You are not authorized to view the admin dashboard."
          );
        }

        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to load dashboard data."
        );
      }

      const data = result.data || {};

      setDashboard({
        stats: {
          ...EMPTY_DATA.stats,
          ...(data.stats || {}),
        },
        facilities: Array.isArray(data.facilities)
          ? data.facilities
          : [],
        todaySchedule: Array.isArray(data.todaySchedule)
          ? data.todaySchedule
          : [],
      });

      setLastUpdated(new Date());
      setNow(new Date());
    } catch (loadError) {
      console.error("Admin dashboard loading error:", loadError);

      setError(
        loadError?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Update the displayed clock without repeatedly fetching dashboard data.
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => clearInterval(timer);
  }, [loadDashboard]);

  const formattedDate = useMemo(() => formatDate(now), [now]);

  const { stats, facilities, todaySchedule } = dashboard;

  const dashboardStats = useMemo(() => {
    const occupancy = Number(stats.averageOccupancy) || 0;
    const confirmed = Number(stats.confirmedBookings) || 0;
    const paid = Number(stats.todayPayments) || 0;

    return [
      {
        label: "Today's Bookings",
        value: (Number(stats.todayBookings) || 0).toLocaleString("en-BD"),
        change: confirmed ? `${confirmed} confirmed` : "Today",
        description: "today's bookings",
        icon: FiCalendar,
      },
      {
        label: "Today's Revenue",
        value: formatMoney(stats.todayRevenue),
        change: paid ? `${paid} paid` : "৳0 paid",
        description: "from paid payments",
        icon: FiDollarSign,
      },
      {
        label: "Upcoming Bookings",
        value: (Number(stats.upcomingBookings) || 0).toLocaleString("en-BD"),
        change: "Next 7 days",
        description: "active bookings",
        icon: FiClock,
      },
      {
        label: "Active Memberships",
        value: (Number(stats.activeMemberships) || 0).toLocaleString("en-BD"),
        change: "Confirmed",
        description: "paid memberships",
        icon: FiUsers,
      },
      {
        label: "Current Occupancy",
        value: `${occupancy}%`,
        change:
          occupancy >= 75
            ? "High"
            : occupancy >= 50
              ? "Healthy"
              : "Available",
        description: "currently running slots",
        icon: FiActivity,
      },
    ];
  }, [stats]);

  const handleRefresh = () => {
    if (!loading && !refreshing) {
      loadDashboard(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              Checkpoint Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-white/40">{formattedDate}</p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="w-fit font-semibold text-red-200 hover:text-white disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardStats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </section>

        <section className="mt-8">
          <SectionHeader
            title="Facility Overview"
            description="Occupancy for the time slot currently in progress"
            action={
              <span className="text-xs text-white/30">
                {loading
                  ? "Loading..."
                  : lastUpdated
                    ? `Updated ${new Intl.DateTimeFormat("en-US", {
                        timeZone: TIME_ZONE,
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(lastUpdated)}`
                    : "Not updated"}
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {!facilities.length ? (
              <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5 text-sm text-white/40 sm:col-span-2 xl:col-span-3">
                {loading
                  ? "Loading facility availability..."
                  : "No facilities available."}
              </div>
            ) : (
              facilities.map((facility, index) => {
                const Icon = FACILITY_ICONS[facility.slug] || FiActivity;
                const current = getOccupancy(facility);

                return (
                  <div
                    key={
                      facility.id ||
                      facility._id ||
                      facility.slug ||
                      index
                    }
                    className="rounded-2xl border border-white/10 bg-[#07101D] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-blue-400">
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {facility.name || "Facility"}
                          </h3>

                          <p className="mt-0.5 text-xs text-white/35">
                            {getFacilityTypeLabel(facility)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusClasses(current.status)}`}
                      >
                        {current.status}
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-white/40">Current slot</span>

                        <span className="text-right font-medium text-white/70">
                          {current.active ? current.time : "No active slot"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-white/40">Occupancy</span>

                        <span className="font-medium text-white/70">
                          {current.active
                            ? `${current.booked} / ${current.capacity}`
                            : "—"}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${current.percentage}%` }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-white/30">
                        {current.active
                          ? `${current.percentage}% occupied`
                          : "No occupancy calculated outside an active slot"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5 sm:p-6">
            <SectionHeader
              title="Today's Schedule"
              description="Upcoming bookings only · Memberships excluded"
              action={
                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  View all
                  <FiArrowUpRight size={14} />
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(150px,1fr)_100px_100px] gap-4 border-b border-white/10 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  <span>Time</span>
                  <span>Service</span>
                  <span>Customer</span>
                  <span>Usage</span>
                  <span>Status</span>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {loading && todaySchedule.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-white/35">
                      Loading today's schedule...
                    </div>
                  ) : todaySchedule.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-white/35">
                      No upcoming bookings for today.
                    </div>
                  ) : (
                    todaySchedule.map((booking, index) => {
                      const bookingStatus = String(
                        booking.status || ""
                      ).toLowerCase();

                      const status =
                        bookingStatus === "confirmed"
                          ? booking.usageStatus === "Booked" ||
                            booking.exclusive === true
                            ? "Booked"
                            : "Confirmed"
                          : bookingStatus === "completed"
                            ? "Completed"
                            : bookingStatus === "cancelled"
                              ? "Cancelled"
                              : bookingStatus === "paid"
                                ? "Paid"
                                : "Pending";

                      const usage =
                        booking.usage ||
                        (booking.exclusive
                          ? "Booked"
                          : booking.quantity != null &&
                              booking.capacity
                            ? `${booking.quantity} / ${booking.capacity}`
                            : "Booked");

                      return (
                        <div
                          key={booking.id || booking._id || index}
                          className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(150px,1fr)_100px_100px] items-center gap-4 px-3 py-4"
                        >
                          <span className="text-sm font-medium text-white/80">
                            {formatTime(booking.startTime)}
                          </span>

                          <span className="truncate text-sm text-white/70">
                            {booking.service?.name ||
                              booking.serviceName ||
                              "—"}
                          </span>

                          <span className="truncate text-sm text-white/40">
                            {booking.customer?.name ||
                              booking.customerName ||
                              "—"}
                          </span>

                          <span className="text-xs text-white/50">
                            {usage}
                          </span>

                          <span
                            className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(status)}`}
                          >
                            {status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex items-center gap-2 px-1 text-xs text-white/25">
          <FiCheckCircle size={13} />

          <span>
            Dashboard data is loaded from the authenticated dashboard API.
          </span>
        </div>
      </div>
    </div>
  );
}
