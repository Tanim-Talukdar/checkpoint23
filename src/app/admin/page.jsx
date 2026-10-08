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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const FACILITY_ICON_MAP = {
  gym: FiActivity,
  "swimming-pool": FiUsers,
  "gym-pool": FiActivity,
  "steam-bath": FiWind,
  playground: FiActivity,
  "private-movie": FiVideo,
};

const FACILITY_TYPE_LABELS = {
  fitness: "Fitness",
  steam: "Wellness",
  playground: "Sports",
  movie: "Entertainment",
};

const FITNESS_DAY_PASS_SLUGS = new Set([
  "gym-day-pass",
  "pool-day-pass",
  "gym-pool-day-pass",
]);

const MEMBERSHIP_TYPES = new Set([
  "membership",
]);

const ACTIVE_BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
]);

const PAID_PAYMENT_STATUSES = new Set([
  "paid",
]);

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getDhakaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
  };
}

function toDateString(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${String(day).padStart(2, "0")}`;
}

function getDhakaDateString(date = new Date()) {
  const parts = getDhakaDateParts(date);

  return toDateString(
    parts.year,
    parts.month,
    parts.day
  );
}

function addCalendarDays(dateString, days) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + days);

  return toDateString(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function formatTime(time) {
  if (!time || typeof time !== "string") {
    return "—";
  }

  const match = time.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return time;
  }

  const hours = Number(match[1]);
  const minutes = match[2];

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour =
    hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHour}:${minutes} ${period}`;
}

function formatBookingDateTime(booking) {
  if (!booking?.bookingDate) {
    return "—";
  }

  const date = new Date(booking.bookingDate);

  if (Number.isNaN(date.getTime())) {
    return `${booking.startTime || "—"}`;
  }

  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  const timeText = booking.startTime
    ? formatTime(booking.startTime)
    : "";

  return timeText
    ? `${dateText}, ${timeText}`
    : dateText;
}

function formatScheduleDateTime(booking, today) {
  if (!booking?.bookingDate) {
    return "—";
  }

  const date = new Date(booking.bookingDate);

  if (Number.isNaN(date.getTime())) {
    return formatTime(booking.startTime);
  }

  const bookingDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);

  if (bookingDate === today) {
    return formatTime(booking.startTime);
  }

  return `${new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
  }).format(date)}, ${formatTime(
    booking.startTime
  )}`;
}

/* -------------------------------------------------------------------------- */
/* API HELPERS                                                                */
/* -------------------------------------------------------------------------- */

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

async function fetchBookings(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return fetchJson(
    `/api/bookings/admin${
      queryString ? `?${queryString}` : ""
    }`
  );
}

async function fetchPayments() {
  return fetchJson("/api/payment");
}

async function fetchFacilities() {
  return fetchJson("/api/facilites");
}

async function fetchBookingSlots(
  facilityId,
  serviceId,
  date
) {
  const query = new URLSearchParams({
    facilityId,
    serviceId,
    date,
  });

  return fetchJson(
    `/api/booking-slots?${query.toString()}`
  );
}

/* -------------------------------------------------------------------------- */
/* DATA HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getOccupancyPercentage(booked, capacity) {
  const safeBooked = Number(booked) || 0;
  const safeCapacity = Number(capacity) || 0;

  if (safeCapacity <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (safeBooked / safeCapacity) * 100
      )
    )
  );
}

function getFacilityIcon(slug) {
  return FACILITY_ICON_MAP[slug] || FiActivity;
}

function getFacilityTypeLabel(facility) {
  return (
    FACILITY_TYPE_LABELS[
      facility?.facilityType
    ] || "Facility"
  );
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
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Completed":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Cancelled":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Failed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-white/10 bg-white/[0.03] text-white/50";
  }
}

function getFacilityStatus(booked, capacity) {
  const safeBooked = Number(booked) || 0;
  const safeCapacity = Number(capacity) || 0;

  if (safeCapacity > 0 && safeBooked >= safeCapacity) {
    return "Full";
  }

  if (
    safeCapacity > 0 &&
    safeBooked / safeCapacity >= 0.75
  ) {
    return "Limited";
  }

  return "Available";
}

function sortBookingsByStartTime(bookings) {
  return [...bookings].sort((a, b) => {
    const aTime =
      typeof a.startTime === "string"
        ? a.startTime
        : "99:99";

    const bTime =
      typeof b.startTime === "string"
        ? b.startTime
        : "99:99";

    return aTime.localeCompare(bTime);
  });
}

function isPaidBooking(booking) {
  return PAID_PAYMENT_STATUSES.has(
    String(booking?.paymentStatus || "").toLowerCase()
  );
}

function isActiveBooking(booking) {
  return ACTIVE_BOOKING_STATUSES.has(
    String(booking?.status || "").toLowerCase()
  );
}

function isMembershipBooking(
  booking,
  membershipServiceNames
) {
  const serviceName = String(
    booking?.service?.name || ""
  ).toLowerCase();

  if (
    membershipServiceNames.has(serviceName)
  ) {
    return true;
  }

  return serviceName.includes("membership");
}

function calculateRevenue(bookings) {
  return bookings.reduce(
    (total, booking) => {
      if (!isPaidBooking(booking)) {
        return total;
      }

      return (
        total +
        (Number(booking.totalAmount) || 0)
      );
    },
    0
  );
}

function calculateAverageOccupancy(
  facilities
) {
  const values = facilities
    .filter(
      (facility) =>
        Number(facility.capacity) > 0
    )
    .map((facility) =>
      getOccupancyPercentage(
        facility.booked,
        facility.capacity
      )
    );

  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );
}

function getBookingUsage(
  booking,
  facilityMap
) {
  const facility = facilityMap.get(
    booking?.facility?.id
  );

  const service = facility?.services?.find(
    (item) =>
      String(item._id) ===
      String(booking?.service?.id)
  );

  if (!service) {
    return {
      usage: "Booked",
      status: "Booked",
    };
  }

  if (
    service.pricingType === "per_booking" ||
    service.exclusive === true
  ) {
    return {
      usage: "Booked",
      status: "Booked",
    };
  }

  const capacity =
    service.capacity == null
      ? null
      : Number(service.capacity);

  const quantity =
    Number(booking.quantity) || 0;

  if (!capacity) {
    return {
      usage: `${quantity}`,
      status: "Available",
    };
  }

  const percentage =
    getOccupancyPercentage(
      quantity,
      capacity
    );

  let status = "Available";

  if (quantity >= capacity) {
    status = "Full";
  } else if (percentage >= 75) {
    status = "Limited";
  }

  return {
    usage: `${quantity} / ${capacity}`,
    status,
  };
}

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                  */
/* -------------------------------------------------------------------------- */

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
        <span className="font-medium text-blue-400">
          {item.change}
        </span>

        <span className="text-white/35">
          {item.description}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION HEADER                                                             */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  description,
  action,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-white/40">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD                                                             */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] =
    useState({
      todayBookings: [],
      upcomingBookings: [],
      recentBookings: [],
      facilities: [],
      payments: [],
      membershipCount: 0,
    });

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const formattedDate = useMemo(
    () => formatDate(),
    [lastUpdated]
  );

  const today = useMemo(
    () => getDhakaDateString(),
    [lastUpdated]
  );

  /* ------------------------------------------------------------------------ */
  /* LOAD DASHBOARD                                                           */
  /* ------------------------------------------------------------------------ */

  const loadDashboard = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const todayDate =
          getDhakaDateString();

        const upcomingDates =
          Array.from(
            { length: 7 },
            (_, index) =>
              addCalendarDays(
                todayDate,
                index
              )
          );

        /*
         * First load the facilities and the main
         * booking/payment data in parallel.
         */
        const [
          facilitiesResponse,
          paymentsResponse,
          todayResponse,
          recentResponse,
          ...upcomingResponses
        ] = await Promise.all([
          fetchFacilities(),
          fetchPayments(),

          fetchBookings({
            date: todayDate,
            limit: 100,
            page: 1,
          }),

          fetchBookings({
            limit: 10,
            page: 1,
          }),

          ...upcomingDates.map((date) =>
            fetchBookings({
              date,
              limit: 100,
              page: 1,
            })
          ),
        ]);

        const facilities =
          Array.isArray(
            facilitiesResponse.facilities
          )
            ? facilitiesResponse.facilities
            : [];

        const todayBookings =
          Array.isArray(
            todayResponse.data
          )
            ? todayResponse.data
            : [];

        const recentBookings =
          Array.isArray(
            recentResponse.data
          )
            ? recentResponse.data
            : [];

        const upcomingBookings =
          upcomingResponses
            .flatMap((response) =>
              Array.isArray(response?.data)
                ? response.data
                : []
            )
            .filter(
              (booking, index, array) =>
                array.findIndex(
                  (item) =>
                    item.id === booking.id
                ) === index
            )
            .filter(
              (booking) =>
                isActiveBooking(booking)
            )
            .sort((a, b) => {
              const aDate =
                new Date(
                  a.bookingDate
                ).getTime();

              const bDate =
                new Date(
                  b.bookingDate
                ).getTime();

              if (aDate !== bDate) {
                return aDate - bDate;
              }

              return String(
                a.startTime || ""
              ).localeCompare(
                String(
                  b.startTime || ""
                )
              );
            });

        /*
         * Memberships are represented by actual membership
         * services in the facility configuration.
         *
         * We query each membership service through the
         * existing admin bookings endpoint using its
         * supported search parameter.
         */
        const membershipServices =
          facilities.flatMap(
            (facility) =>
              Array.isArray(
                facility.services
              )
                ? facility.services
                    .filter(
                      (service) =>
                        MEMBERSHIP_TYPES.has(
                          service.type
                        ) ||
                        service.pricingType ===
                          "monthly"
                    )
                    .map((service) => ({
                      facility,
                      service,
                    }))
                : []
          );

        const membershipResponses =
          await Promise.all(
            membershipServices.map(
              ({ service }) =>
                fetchBookings({
                  limit: 100,
                  page: 1,
                  status: "confirmed",
                  paymentStatus: "paid",
                  search: service.name,
                })
            )
          );

        const membershipIds =
          new Set();

        membershipResponses.forEach(
          (response) => {
            if (
              !Array.isArray(
                response?.data
              )
            ) {
              return;
            }

            response.data.forEach(
              (booking) => {
                if (
                  isMembershipBooking(
                    booking,
                    new Set(
                      membershipServices.map(
                        ({
                          service,
                        }) =>
                          service.name.toLowerCase()
                      )
                    )
                  )
                ) {
                  membershipIds.add(
                    booking.id
                  );
                }
              }
            );
          }
        );

        /*
         * Booking-slot calls are made only for the
         * primary capacity-bearing service of each
         * facility.
         *
         * Membership services are deliberately skipped.
         */
        const slotRequests =
          facilities.flatMap(
            (facility) => {
              const services =
                Array.isArray(
                  facility.services
                )
                  ? facility.services
                  : [];

              let service = null;

              if (
                facility.slug ===
                "playground"
              ) {
                service =
                  services.find(
                    (item) =>
                      item.slug ===
                      "futsal"
                  ) || services[0];
              } else if (
                facility.slug ===
                "private-movie"
              ) {
                service =
                  services.find(
                    (item) =>
                      item.type ===
                      "private_movie"
                  ) || services[0];
              } else {
                service =
                  services.find(
                    (item) =>
                      item.type ===
                      "day_pass"
                  ) ||
                  services.find(
                    (item) =>
                      item.pricingType !==
                      "monthly"
                  ) ||
                  services[0];
              }

              if (
                !service ||
                service.type ===
                  "membership" ||
                service.pricingType ===
                  "monthly"
              ) {
                return [];
              }

              return [
                {
                  facility,
                  service,
                },
              ];
            }
          );

        const slotResponses =
          await Promise.all(
            slotRequests.map(
              async ({
                facility,
                service,
              }) => {
                try {
                  const response =
                    await fetchBookingSlots(
                      String(
                        facility._id
                      ),
                      String(
                        service._id
                      ),
                      todayDate
                    );

                  return {
                    facilityId:
                      String(
                        facility._id
                      ),
                    response,
                  };
                } catch {
                  return {
                    facilityId:
                      String(
                        facility._id
                      ),
                    response: null,
                  };
                }
              }
            )
          );

        const slotResponseMap =
          new Map(
            slotResponses.map(
              (item) => [
                item.facilityId,
                item.response,
              ]
            )
          );

        /*
         * Build facility overview data from
         * real booking-slot availability.
         */
        const liveFacilities =
          facilities.map(
            (facility) => {
              const facilityId =
                String(
                  facility._id
                );

              const slotResponse =
                slotResponseMap.get(
                  facilityId
                );

              const service =
                slotResponse?.service ||
                (
                  Array.isArray(
                    facility.services
                  )
                    ? facility.services.find(
                        (item) =>
                          item.type ===
                          "day_pass"
                      ) ||
                      facility.services.find(
                        (item) =>
                          item.pricingType !==
                          "monthly"
                      )
                    : null
                );

              const slots =
                Array.isArray(
                  slotResponse?.slots
                )
                  ? slotResponse.slots
                  : [];

              /*
               * For a live overview, use the highest
               * booked count among today's slots.
               *
               * This represents the current maximum
               * simultaneous occupancy visible from
               * the availability API.
               */
              const maxBooked =
                slots.length
                  ? Math.max(
                      ...slots.map(
                        (slot) =>
                          Number(
                            slot.booked
                          ) || 0
                      )
                    )
                  : 0;

              const capacity =
                service?.capacity !=
                null
                  ? Number(
                      service.capacity
                    )
                  : slots.length
                  ? Math.max(
                      ...slots.map(
                        (slot) =>
                          Number(
                            slot.capacity
                          ) || 0
                      )
                    )
                  : 0;

              /*
               * If there are no slots, fall back
               * to today's active bookings for this
               * facility.
               */
              const fallbackBooked =
                todayBookings
                  .filter(
                    (booking) =>
                      String(
                        booking
                          ?.facility
                          ?.id
                      ) ===
                      facilityId
                  )
                  .filter(
                    (booking) =>
                      isActiveBooking(
                        booking
                      )
                  )
                  .reduce(
                    (sum, booking) =>
                      sum +
                      (Number(
                        booking.quantity
                      ) || 0),
                    0
                  );

              const booked =
                slots.length
                  ? maxBooked
                  : fallbackBooked;

              const safeCapacity =
                capacity > 0
                  ? capacity
                  : facility.slug ===
                    "private-movie"
                  ? 50
                  : facility.slug ===
                    "playground"
                  ? 1
                  : 0;

              return {
                id: facilityId,
                name: facility.name,
                slug: facility.slug,
                type: getFacilityTypeLabel(
                  facility
                ),
                booked,
                capacity:
                  safeCapacity,
                status:
                  safeCapacity > 0
                    ? getFacilityStatus(
                        booked,
                        safeCapacity
                      )
                    : "Available",
                icon:
                  getFacilityIcon(
                    facility.slug
                  ),
              };
            }
          );

        setDashboardData({
          todayBookings,
          upcomingBookings,
          recentBookings,
          facilities: liveFacilities,
          payments: Array.isArray(
            paymentsResponse.transactions
          )
            ? paymentsResponse.transactions
            : [],
          membershipCount:
            membershipIds.size,
        });

        setLastUpdated(new Date());
      } catch (loadError) {
        console.error(
          "Admin dashboard loading error:",
          loadError
        );

        setError(
          loadError?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* INITIAL LOAD                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ------------------------------------------------------------------------ */
  /* DERIVED DATA                                                             */
  /* ------------------------------------------------------------------------ */

  const todayBookings =
    dashboardData.todayBookings;

  const upcomingBookings =
    dashboardData.upcomingBookings;

  const recentBookings =
    dashboardData.recentBookings;

  const facilities =
    dashboardData.facilities;

  const todayRevenue =
    calculateRevenue(todayBookings);

  const occupancy =
    calculateAverageOccupancy(
      facilities
    );

  const confirmedToday =
    todayBookings.filter(
      (booking) =>
        booking.status ===
        "confirmed"
    ).length;

  const paidToday =
    todayBookings.filter(
      (booking) =>
        booking.paymentStatus ===
        "paid"
    ).length;

  const dashboardStats = [
    {
      label: "Today's Bookings",
      value: todayBookings.length.toLocaleString(
        "en-BD"
      ),
      change:
        confirmedToday > 0
          ? `${confirmedToday} confirmed`
          : "Live",
      description:
        "today's bookings",
      icon: FiCalendar,
    },
    {
      label: "Today's Revenue",
      value: `৳${todayRevenue.toLocaleString(
        "en-BD"
      )}`,
      change:
        paidToday > 0
          ? `${paidToday} paid`
          : "৳0 paid",
      description:
        "from paid bookings",
      icon: FiDollarSign,
    },
    {
      label: "Upcoming Bookings",
      value:
        upcomingBookings.length.toLocaleString(
          "en-BD"
        ),
      change: "Next 7 days",
      description:
        "active bookings",
      icon: FiClock,
    },
    {
      label: "Active Memberships",
      value:
        dashboardData.membershipCount.toLocaleString(
          "en-BD"
        ),
      change: "Confirmed",
      description:
        "paid memberships",
      icon: FiUsers,
    },
    {
      label: "Today's Occupancy",
      value: `${occupancy}%`,
      change:
        occupancy >= 75
          ? "High"
          : occupancy >= 50
          ? "Healthy"
          : "Available",
      description:
        "facility usage",
      icon: FiActivity,
    },
  ];

  const facilityMap = useMemo(
    () =>
      new Map(
        dashboardData.facilities.map(
          (facility) => [
            facility.id,
            facility,
          ]
        )
      ),
    [dashboardData.facilities]
  );

  const todaySchedule =
    useMemo(
      () =>
        sortBookingsByStartTime(
          todayBookings
        ),
      [todayBookings]
    );

  const formattedRecentBookings =
    useMemo(
      () =>
        recentBookings.slice(0, 5),
      [recentBookings]
    );

  /* ------------------------------------------------------------------------ */
  /* REFRESH                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = () => {
    loadDashboard({
      refresh: true,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#050A14]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">
              Checkpoint Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-white/40">
              {formattedDate}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loading || refreshing
            }
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Main statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {dashboardStats.map(
            (item) => (
              <StatCard
                key={item.label}
                item={item}
              />
            )
          )}
        </section>

        {/* Facility Overview */}
        <section className="mt-8">
          <SectionHeader
            title="Facility Overview"
            description="Current usage across Checkpoint facilities"
            action={
              <span className="text-xs text-white/30">
                {loading
                  ? "Loading..."
                  : `Updated ${lastUpdated.toLocaleTimeString(
                      "en-US",
                      {
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    )}`}
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {facilities.length ===
            0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5 text-sm text-white/40 sm:col-span-2 xl:col-span-3">
                {loading
                  ? "Loading facility availability..."
                  : "No facilities available."}
              </div>
            ) : (
              facilities.map(
                (facility) => {
                  const Icon =
                    facility.icon;

                  const percentage =
                    getOccupancyPercentage(
                      facility.booked,
                      facility.capacity
                    );

                  return (
                    <div
                      key={
                        facility.id
                      }
                      className="rounded-2xl border border-white/10 bg-[#07101D] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-blue-400">
                            <Icon
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-white">
                              {
                                facility.name
                              }
                            </h3>

                            <p className="mt-0.5 text-xs text-white/35">
                              {
                                facility.type
                              }
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusClasses(
                            facility.status
                          )}`}
                        >
                          {
                            facility.status
                          }
                        </span>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">
                            Occupancy
                          </span>

                          <span className="font-medium text-white/70">
                            {
                              facility.booked
                            }{" "}
                            /{" "}
                            {
                              facility.capacity
                            }
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-white/30">
                          {
                            percentage
                          }
                          % occupied
                        </p>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* Today's Schedule */}
        <section className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-[#07101D] p-5 sm:p-6">
            <SectionHeader
              title="Today's Schedule"
              description="Upcoming activity for today"
              action={
                <Link
                  href="/admin/bookings"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                >
                  View all
                  <FiArrowUpRight
                    size={14}
                  />
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(150px,1fr)_100px_100px] gap-4 border-b border-white/10 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                  <span>
                    Time
                  </span>

                  <span>
                    Service
                  </span>

                  <span>
                    Customer
                  </span>

                  <span>
                    Usage
                  </span>

                  <span>
                    Status
                  </span>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {loading &&
                  todaySchedule.length ===
                    0 ? (
                    <div className="px-3 py-8 text-center text-sm text-white/35">
                      Loading today's
                      schedule...
                    </div>
                  ) : todaySchedule.length ===
                    0 ? (
                    <div className="px-3 py-8 text-center text-sm text-white/35">
                      No bookings
                      scheduled for
                      today.
                    </div>
                  ) : (
                    todaySchedule.map(
                      (item) => {
                        const usage =
                          getBookingUsage(
                            item,
                            facilityMap
                          );

                        const status =
                          item.status ===
                          "confirmed"
                            ? usage.status ===
                              "Booked"
                              ? "Booked"
                              : "Confirmed"
                            : item.status ===
                              "pending"
                            ? "Pending"
                            : item.status ===
                              "cancelled"
                            ? "Cancelled"
                            : "Completed";

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(150px,1fr)_100px_100px] items-center gap-4 px-3 py-4"
                          >
                            <span className="text-sm font-medium text-white/80">
                              {formatTime(
                                item.startTime
                              )}
                            </span>

                            <span className="truncate text-sm text-white/70">
                              {
                                item
                                  .service
                                  ?.name
                              }
                            </span>

                            <span className="truncate text-sm text-white/40">
                              {
                                item
                                  .customer
                                  ?.name
                              }
                            </span>

                            <span className="text-xs text-white/50">
                              {
                                usage.usage
                              }
                            </span>

                            <span
                              className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Bookings */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-[#07101D] p-5 sm:p-6">
          <SectionHeader
            title="Recent Bookings"
            description="Latest Checkpoint bookings"
            action={
              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300"
              >
                View all bookings
                <FiArrowUpRight
                  size={14}
                />
              </Link>
            }
          />

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(190px,1fr)_160px_110px_110px] gap-4 border-b border-white/10 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                <span>ID</span>
                <span>
                  Customer
                </span>
                <span>
                  Service
                </span>
                <span>
                  Date & Time
                </span>
                <span>
                  Amount
                </span>
                <span>
                  Status
                </span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {loading &&
                formattedRecentBookings.length ===
                  0 ? (
                  <div className="px-3 py-8 text-center text-sm text-white/35">
                    Loading recent
                    bookings...
                  </div>
                ) : formattedRecentBookings.length ===
                  0 ? (
                  <div className="px-3 py-8 text-center text-sm text-white/35">
                    No bookings
                    found.
                  </div>
                ) : (
                  formattedRecentBookings.map(
                    (booking) => {
                      const status =
                        booking.status
                          ? booking.status
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                            booking.status.slice(
                              1
                            )
                          : "Unknown";

                      return (
                        <div
                          key={
                            booking.id
                          }
                          className="grid grid-cols-[110px_minmax(150px,1fr)_minmax(190px,1fr)_160px_110px_110px] items-center gap-4 px-3 py-4"
                        >
                          <span className="text-xs font-medium text-blue-400">
                            #
                            {
                              booking.bookingReference
                            }
                          </span>

                          <span className="truncate text-sm text-white/75">
                            {
                              booking
                                .customer
                                ?.name
                            }
                          </span>

                          <span className="truncate text-sm text-white/50">
                            {
                              booking
                                .service
                                ?.name
                            }
                          </span>

                          <span className="text-xs text-white/40">
                            {formatBookingDateTime(
                              booking
                            )}
                          </span>

                          <span className="text-sm font-medium text-white/75">
                            ৳
                            {(
                              Number(
                                booking.totalAmount
                              ) ||
                              0
                            ).toLocaleString(
                              "en-BD"
                            )}
                          </span>

                          <span
                            className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {
                              status
                            }
                          </span>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom system note */}
        <div className="mt-6 flex items-center gap-2 px-1 text-xs text-white/25">
          <FiCheckCircle size={13} />

          <span>
            Dashboard data is connected to
            live booking, payment, facility,
            and availability APIs.
          </span>
        </div>
      </div>
    </div>
  );
}