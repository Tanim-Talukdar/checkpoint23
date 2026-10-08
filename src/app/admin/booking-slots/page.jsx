"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MdAccessTime,
  MdArrowBack,
  MdCalendarMonth,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdEdit,
  MdEventAvailable,
  MdExpandMore,
  MdFitnessCenter,
  MdInfoOutline,
  MdLocalMovies,
  MdPool,
  MdRefresh,
  MdSave,
  MdSportsSoccer,
  MdWarning,
} from "react-icons/md";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const FACILITY_CONFIG = {
  gym: {
    name: "Gym",
    icon: MdFitnessCenter,
    color: "blue",
    description: "Gym day-pass sessions",
    type: "capacity",
  },

  pool: {
    name: "Swimming Pool",
    icon: MdPool,
    color: "cyan",
    description: "Swimming pool day-pass sessions",
    type: "capacity",
  },

  "gym-pool": {
    name: "Gym + Pool",
    icon: MdFitnessCenter,
    color: "violet",
    description: "Combined gym and pool access",
    type: "capacity",
  },

  steam: {
    name: "Steam Bath",
    icon: MdAccessTime,
    color: "orange",
    description: "Private exclusive steam sessions",
    type: "exclusive",
  },

  playground: {
    name: "Playground",
    icon: MdSportsSoccer,
    color: "green",
    description: "Shared playground for sports",
    type: "shared",
  },

  "private-movie": {
    name: "Private Movie",
    icon: MdLocalMovies,
    color: "pink",
    description: "Private movie viewing",
    type: "movie",
  },
};

const DEFAULT_CONFIG = {
  icon: MdCalendarMonth,
  color: "blue",
  description: "Facility booking sessions",
  type: "capacity",
};

const MOVIE_SERVICE_SLUG = "private-movie-booking";

const PLAYGROUND_SERVICE_ORDER = [
  "futsal",
  "basketball",
  "badminton",
  "pickleball",
];

const PLAYGROUND_SERVICE_LABELS = {
  futsal: "Futsal",
  basketball: "Basketball",
  badminton: "Badminton",
  pickleball: "Pickleball",
};

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

const formatDate = (date) =>
  date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateForApi = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const createDate = (offset = 0) => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  return date;
};

const moveDateValue = (date, amount) => {
  const next = new Date(date);

  next.setDate(next.getDate() + amount);

  return next;
};

/* -------------------------------------------------------------------------- */
/* TIME HELPERS                                                               */
/* -------------------------------------------------------------------------- */

const timeToMinutes = (value) => {
  if (typeof value !== "string") return null;

  const [hours, minutes] = value.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatTime24 = (value) => {
  const minutes = timeToMinutes(value);

  if (minutes === null) return "--";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
};

/* -------------------------------------------------------------------------- */
/* UI HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

const getStatus = (slot) => {
  if (!slot?.available || slot?.remaining <= 0) {
    return "Full";
  }

  const capacity = Number(slot.capacity);
  const remaining = Number(slot.remaining);
  const booked = Number(slot.booked);

  if (
    Number.isFinite(capacity) &&
    capacity > 0 &&
    Number.isFinite(booked) &&
    booked > 0
  ) {
    const percentage = (booked / capacity) * 100;

    if (percentage >= 70) {
      return "Limited";
    }
  }

  if (Number.isFinite(remaining) && remaining > 0) {
    return "Available";
  }

  return "Full";
};

const getStatusClasses = (status) => {
  if (status === "Full") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (status === "Limited") {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
};

const getIconClasses = (color) => {
  const map = {
    blue: "bg-blue-500/10 text-blue-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
    violet: "bg-violet-500/10 text-violet-400",
    orange: "bg-orange-500/10 text-orange-400",
    green: "bg-emerald-500/10 text-emerald-400",
    pink: "bg-pink-500/10 text-pink-400",
  };

  return map[color] || "bg-white/10 text-white";
};

const getFacilityConfig = (facility) => {
  return FACILITY_CONFIG[facility?.slug] || {
    ...DEFAULT_CONFIG,
    name: facility?.name || "Facility",
  };
};

/* -------------------------------------------------------------------------- */
/* RESPONSE HELPER                                                            */
/* -------------------------------------------------------------------------- */

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    throw new Error(
      text?.slice(0, 200) ||
        `Request failed with status ${response.status}.`
    );
  }

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* FACILITY DATA NORMALIZATION                                                */
/* -------------------------------------------------------------------------- */

function getSlotService(facility) {
  const services = Array.isArray(facility?.services)
    ? facility.services.filter((service) => service?.active !== false)
    : [];

  if (services.length === 0) {
    return null;
  }

  const config = getFacilityConfig(facility);

  if (config.type === "movie") {
    return (
      services.find(
        (service) => service.slug === MOVIE_SERVICE_SLUG
      ) ||
      services.find(
        (service) => service.type === "private_movie"
      ) ||
      services[0]
    );
  }

  if (config.type === "shared") {
    return (
      services.find(
        (service) =>
          service.type === "activity" &&
          service.slug === "futsal"
      ) ||
      services.find((service) => service.type === "activity") ||
      services[0]
    );
  }

  return (
    services.find(
      (service) => service.type !== "membership"
    ) || null
  );
}

function getPlaygroundServices(facility) {
  if (getFacilityConfig(facility).type !== "shared") {
    return [];
  }

  const services = Array.isArray(facility?.services)
    ? facility.services.filter(
        (service) =>
          service?.active !== false &&
          service?.type === "activity"
      )
    : [];

  return services.sort((a, b) => {
    const aIndex = PLAYGROUND_SERVICE_ORDER.indexOf(a.slug);
    const bIndex = PLAYGROUND_SERVICE_ORDER.indexOf(b.slug);

    return (
      (aIndex === -1 ? 999 : aIndex) -
      (bIndex === -1 ? 999 : bIndex)
    );
  });
}

function getFacilityScheduleForDay(facility, dayOfWeek) {
  if (!Array.isArray(facility?.schedules)) {
    return null;
  }

  return (
    facility.schedules.find(
      (schedule) =>
        schedule?.active !== false &&
        Number(schedule?.dayOfWeek) === Number(dayOfWeek)
    ) || null
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function SchedulePage() {
  const [facilities, setFacilities] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(createDate(0));
  const [selectedFacility, setSelectedFacility] = useState("all");

  const [editingFacility, setEditingFacility] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* ------------------------------------------------------------------------ */
  /* LOAD FACILITIES                                                          */
  /* ------------------------------------------------------------------------ */

  const loadFacilities = useCallback(async () => {
    try {
      setLoadingFacilities(true);
      setError("");

      const response = await fetch("/api/facilites", {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseJsonResponse(response);

      const loadedFacilities = Array.isArray(data?.facilities)
        ? data.facilities
        : Array.isArray(data)
        ? data
        : [];

      setFacilities(loadedFacilities);
    } catch (requestError) {
      console.error("Failed to load facilities:", requestError);

      setError(
        requestError?.message ||
          "Unable to load facilities from the database."
      );
    } finally {
      setLoadingFacilities(false);
    }
  }, []);

  /* ------------------------------------------------------------------------ */
  /* LOAD AVAILABILITY                                                        */
  /* ------------------------------------------------------------------------ */

  const loadAvailability = useCallback(
    async (facilityList, date) => {
      if (!Array.isArray(facilityList) || facilityList.length === 0) {
        setAvailability({});
        return;
      }

      try {
        setLoadingSlots(true);
        setError("");

        const dateString = formatDateForApi(date);

        const requests = facilityList.map(async (facility) => {
          const service = getSlotService(facility);

          if (!service) {
            return {
              facilityId: String(facility._id || facility.id),
              data: null,
            };
          }

          const facilityId = String(
            facility._id || facility.id
          );

          const serviceId = String(service._id || service.id);

          const response = await fetch(
            `/api/booking-slots?facilityId=${encodeURIComponent(
              facilityId
            )}&serviceId=${encodeURIComponent(
              serviceId
            )}&date=${encodeURIComponent(dateString)}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const data = await parseJsonResponse(response);

          return {
            facilityId,
            data,
          };
        });

        const results = await Promise.all(requests);

        const nextAvailability = {};

        results.forEach(({ facilityId, data }) => {
          nextAvailability[facilityId] = data;
        });

        setAvailability(nextAvailability);
      } catch (requestError) {
        console.error(
          "Failed to load booking availability:",
          requestError
        );

        setError(
          requestError?.message ||
            "Unable to load booking availability."
        );
      } finally {
        setLoadingSlots(false);
      }
    },
    []
  );

  /* ------------------------------------------------------------------------ */
  /* INITIAL LOAD                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  /* ------------------------------------------------------------------------ */
  /* AVAILABILITY LOAD                                                        */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (facilities.length === 0) {
      return;
    }

    loadAvailability(facilities, selectedDate);
  }, [
    facilities,
    selectedDate,
    loadAvailability,
  ]);

  /* ------------------------------------------------------------------------ */
  /* VISIBLE FACILITIES                                                       */
  /* ------------------------------------------------------------------------ */

  const visibleFacilities = useMemo(() => {
    if (selectedFacility === "all") {
      return facilities;
    }

    return facilities.filter(
      (facility) =>
        String(facility._id || facility.id) ===
        String(selectedFacility)
    );
  }, [facilities, selectedFacility]);

  /* ------------------------------------------------------------------------ */
  /* DISPLAY FACILITY DATA                                                    */
  /* ------------------------------------------------------------------------ */

  const displayFacilities = useMemo(() => {
    return visibleFacilities.map((facility) => {
      const facilityId = String(
        facility._id || facility.id
      );

      const config = getFacilityConfig(facility);
      const data = availability[facilityId];

      const schedule =
        data?.schedules?.[0] ||
        getFacilityScheduleForDay(
          facility,
          data?.dayOfWeek
        );

      const service =
        data?.service ||
        getSlotService(facility);

      const slots = Array.isArray(data?.slots)
        ? data.slots
        : [];

      const playgroundServices =
        getPlaygroundServices(facility);

      return {
        ...facility,
        id: facilityId,
        displayName: data?.facility?.name || facility.name,
        icon: config.icon,
        color: config.color,
        description:
          data?.facility?.description ||
          facility.description ||
          config.description,
        type: config.type,
        service,
        schedule,
        slots,
        playgroundServices,
        loading: loadingSlots && !data,
        noSchedule:
          Boolean(data) &&
          data?.slotBased === true &&
          Array.isArray(data?.slots) &&
          data.slots.length === 0 &&
          data?.message?.includes("No active schedule"),
      };
    });
  }, [
    visibleFacilities,
    availability,
    loadingSlots,
  ]);

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    let totalSlots = 0;
    let fullSlots = 0;
    let availableSlots = 0;
    let bookedCapacity = 0;

    displayFacilities.forEach((facility) => {
      facility.slots.forEach((slot) => {
        totalSlots += 1;

        const booked = Number(slot.booked);

        if (Number.isFinite(booked)) {
          bookedCapacity += booked;
        }

        if (slot.available && Number(slot.remaining) > 0) {
          availableSlots += 1;
        } else {
          fullSlots += 1;
        }
      });
    });

    return {
      totalSlots,
      fullSlots,
      availableSlots,
      bookedCapacity,
    };
  }, [displayFacilities]);

  /* ------------------------------------------------------------------------ */
  /* TOAST                                                                    */
  /* ------------------------------------------------------------------------ */

  const showToast = useCallback((message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2500);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* DATE CONTROLS                                                            */
  /* ------------------------------------------------------------------------ */

  const moveDate = (amount) => {
    setSelectedDate((current) =>
      moveDateValue(current, amount)
    );
  };

  /* ------------------------------------------------------------------------ */
  /* REFRESH                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = async () => {
    setError("");

    await loadFacilities();

    if (facilities.length > 0) {
      await loadAvailability(
        facilities,
        selectedDate
      );
    }

    showToast("Schedule and availability refreshed.");
  };

  /* ------------------------------------------------------------------------ */
  /* SAVE SCHEDULE                                                            */
  /* ------------------------------------------------------------------------ */

  const handleSaveSchedule = async (
    facilityId,
    schedule
  ) => {
    try {
      setSavingSchedule(true);
      setError("");

      const response = await fetch(
        `/api/facilites/${encodeURIComponent(
          facilityId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schedules: schedule.schedules,
          }),
        }
      );

      await parseJsonResponse(response);

      setEditingFacility(null);

      await loadFacilities();

      showToast("Schedule updated successfully.");
    } catch (requestError) {
      console.error(
        "Failed to save schedule:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to save the schedule."
      );
    } finally {
      setSavingSchedule(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b border-white/[0.06] bg-[#050A14]/95 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/admin"
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-gray-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                aria-label="Back to dashboard"
              >
                <MdArrowBack size={20} />
              </Link>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                    Operations
                  </p>

                  <span className="h-1 w-1 rounded-full bg-gray-700" />

                  <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                    Schedule
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Schedule & Slots
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manage recurring facility schedules and
                  view real-time daily booking availability.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInfo(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-sm font-medium text-gray-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
              >
                <MdInfoOutline size={18} />
                <span className="hidden sm:inline">
                  How it works
                </span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  loadingFacilities ||
                  loadingSlots ||
                  savingSchedule
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-sm font-medium text-gray-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MdRefresh
                  size={18}
                  className={
                    loadingFacilities ||
                    loadingSlots
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                            */}
      {/* ------------------------------------------------------------------ */}

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && (
          <section className="mb-6 rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-4">
            <div className="flex gap-3">
              <MdWarning
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-semibold text-red-300">
                  Unable to load schedule data
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300/70">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* DATE + FILTER BAR */}

        <section className="mb-6 rounded-2xl border border-white/[0.06] bg-[#07101C] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MdCalendarMonth size={20} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Selected Date
                </p>

                <p className="text-sm font-semibold text-white">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
                <button
                  type="button"
                  onClick={() => moveDate(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                  aria-label="Previous day"
                >
                  <MdChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(createDate(0))
                  }
                  className="px-3 text-xs font-semibold text-gray-300 transition hover:text-white"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => moveDate(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                  aria-label="Next day"
                >
                  <MdChevronRight size={20} />
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedFacility}
                  onChange={(event) =>
                    setSelectedFacility(
                      event.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 pr-10 text-sm text-gray-200 outline-none transition focus:border-blue-500/40 sm:min-w-[220px]"
                >
                  <option
                    value="all"
                    className="bg-[#07101C]"
                  >
                    All Facilities
                  </option>

                  {facilities.map((facility) => (
                    <option
                      key={String(facility._id)}
                      value={String(facility._id)}
                      className="bg-[#07101C]"
                    >
                      {facility.name}
                    </option>
                  ))}
                </select>

                <MdExpandMore
                  size={19}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={MdEventAvailable}
            label="Total Slots"
            value={summary.totalSlots}
            description="Generated for selected date"
          />

          <SummaryCard
            icon={MdCheckCircle}
            label="Available"
            value={summary.availableSlots}
            description="Slots with remaining capacity"
          />

          <SummaryCard
            icon={MdWarning}
            label="Full"
            value={summary.fullSlots}
            description="No remaining capacity"
          />

          <SummaryCard
            icon={MdAccessTime}
            label="Booked Capacity"
            value={summary.bookedCapacity}
            description="Active bookings"
          />
        </section>

        {/* INFORMATION STRIP */}

        <section className="mb-6 rounded-2xl border border-blue-400/10 bg-blue-500/[0.04] p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 text-blue-400">
              <MdInfoOutline size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-200">
                Live booking availability
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Slots are now generated by the backend from
                the selected facility&apos;s database schedule.
                Existing pending and confirmed bookings are
                used to calculate capacity. Memberships do not
                appear as time slots.
              </p>
            </div>
          </div>
        </section>

        {/* LOADING */}

        {loadingFacilities && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#07101C] px-6 py-16 text-center">
            <MdRefresh
              size={30}
              className="mx-auto animate-spin text-blue-400"
            />

            <p className="mt-3 text-sm font-semibold text-gray-300">
              Loading facilities...
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Reading the current facility configuration.
            </p>
          </div>
        )}

        {/* FACILITIES */}

        {!loadingFacilities && (
          <section className="space-y-5">
            {displayFacilities.map((facility) => (
              <FacilityScheduleCard
                key={facility.id}
                facility={facility}
                onEdit={() =>
                  setEditingFacility(facility)
                }
                loading={facility.loading}
              />
            ))}
          </section>
        )}

        {!loadingFacilities &&
          displayFacilities.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#07101C] px-6 py-16 text-center">
              <MdCalendarMonth
                size={34}
                className="mx-auto text-gray-600"
              />

              <p className="mt-3 text-sm font-semibold text-gray-300">
                No facilities found
              </p>

              <p className="mt-1 text-xs text-gray-600">
                No active facilities were returned by the
                database.
              </p>
            </div>
          )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* EDIT MODAL                                                         */}
      {/* ------------------------------------------------------------------ */}

      {editingFacility && (
        <ScheduleEditModal
          facility={editingFacility}
          saving={savingSchedule}
          onClose={() =>
            savingSchedule
              ? null
              : setEditingFacility(null)
          }
          onSave={(schedule) => {
            handleSaveSchedule(
              editingFacility.id,
              schedule
            );
          }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* INFO MODAL                                                         */}
      {/* ------------------------------------------------------------------ */}

      {showInfo && (
        <InfoModal
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TOAST                                                              */}
      {/* ------------------------------------------------------------------ */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#0A1624] px-4 py-3 text-sm font-medium text-gray-200 shadow-2xl shadow-black/40">
            <MdCheckCircle
              className="text-emerald-400"
              size={19}
            />

            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY CARD                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#07101C] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-600">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.035] text-gray-400">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FACILITY CARD                                                              */
/* -------------------------------------------------------------------------- */

function FacilityScheduleCard({
  facility,
  onEdit,
  loading,
}) {
  const Icon = facility.icon;

  const slots = Array.isArray(facility.slots)
    ? facility.slots
    : [];

  const totalBooked = slots.reduce(
    (sum, slot) => {
      const booked = Number(slot.booked);

      return Number.isFinite(booked)
        ? sum + booked
        : sum;
    },
    0
  );

  const fullCount = slots.filter(
    (slot) =>
      !slot.available ||
      Number(slot.remaining) <= 0
  ).length;

  const schedule = facility.schedule;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#07101C]">
      {/* CARD HEADER */}

      <div className="border-b border-white/[0.06] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getIconClasses(
                facility.color
              )}`}
            >
              <Icon size={21} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-white">
                  {facility.displayName}
                </h2>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                    facility.active !== false
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-gray-400/20 bg-gray-400/10 text-gray-400"
                  }`}
                >
                  {facility.active !== false
                    ? "Active"
                    : "Disabled"}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {facility.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.12em] text-gray-600">
                Hours
              </p>

              <p className="mt-0.5 text-xs font-medium text-gray-300">
                {schedule
                  ? `${formatTime24(
                      schedule.startTime
                    )} — ${formatTime24(
                      schedule.endTime
                    )}`
                  : "--"}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.12em] text-gray-600">
                Slot Interval
              </p>

              <p className="mt-0.5 text-xs font-medium text-gray-300">
                {schedule
                  ? `${schedule.slotDurationMinutes} min`
                  : "--"}
              </p>
            </div>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-xs font-semibold text-gray-300 transition hover:border-blue-400/20 hover:bg-blue-500/[0.05] hover:text-white"
            >
              <MdEdit size={17} />
              Edit Schedule
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-500">
          <span className="rounded-lg bg-white/[0.025] px-2.5 py-1.5">
            {slots.length} slots
          </span>

          <span className="rounded-lg bg-white/[0.025] px-2.5 py-1.5">
            {totalBooked} booked
          </span>

          <span className="rounded-lg bg-white/[0.025] px-2.5 py-1.5">
            {fullCount} full
          </span>

          {facility.type === "exclusive" && (
            <span className="rounded-lg bg-orange-500/[0.06] px-2.5 py-1.5 text-orange-300">
              Exclusive
            </span>
          )}

          {facility.type === "shared" && (
            <span className="rounded-lg bg-emerald-500/[0.06] px-2.5 py-1.5 text-emerald-300">
              Shared physical facility
            </span>
          )}

          {facility.type === "movie" && (
            <span className="rounded-lg bg-pink-500/[0.06] px-2.5 py-1.5 text-pink-300">
              50 seats
            </span>
          )}
        </div>
      </div>

      {/* SLOT GRID */}

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
              Generated Slots
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {facility.type === "exclusive"
                ? "A booked steam slot blocks the entire slot."
                : facility.type === "shared"
                ? "Any playground booking blocks overlapping playground activity."
                : facility.type === "movie"
                ? "Private viewing uses the full three-hour session."
                : "Availability is calculated from active bookings."}
            </p>
          </div>

          {loading && (
            <MdRefresh
              size={18}
              className="animate-spin text-blue-400"
            />
          )}
        </div>

        {facility.noSchedule && (
          <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-4">
            <div className="flex gap-2.5">
              <MdWarning
                size={18}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <div>
                <p className="text-xs font-semibold text-amber-300">
                  No active schedule for this day
                </p>

                <p className="mt-1 text-[11px] leading-5 text-gray-600">
                  No slots can be generated for the
                  selected date.
                </p>
              </div>
            </div>
          </div>
        )}

        {!facility.noSchedule &&
          slots.length === 0 &&
          !loading && (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] p-8 text-center">
              <MdEventAvailable
                size={27}
                className="mx-auto text-gray-600"
              />

              <p className="mt-2 text-xs font-semibold text-gray-400">
                No generated slots
              </p>

              <p className="mt-1 text-[11px] text-gray-600">
                Check the facility schedule and service
                configuration.
              </p>
            </div>
          )}

        {slots.length > 0 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {slots.map((slot) => (
              <SlotCard
                key={`${facility.id}-${slot.startTime}-${slot.endTime}`}
                facility={facility}
                slot={slot}
              />
            ))}
          </div>
        )}

        {/* PLAYGROUND SERVICE INFO */}

        {facility.type === "shared" &&
          facility.playgroundServices.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.05] pt-4">
              {facility.playgroundServices.map(
                (service) => (
                  <span
                    key={String(service._id)}
                    className="rounded-lg bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-gray-500"
                  >
                    {PLAYGROUND_SERVICE_LABELS[
                      service.slug
                    ] ||
                      service.name}
                    {service.durationMinutes
                      ? ` · ${service.durationMinutes} min`
                      : ""}
                  </span>
                )
              )}
            </div>
          )}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* SLOT CARD                                                                  */
/* -------------------------------------------------------------------------- */

function SlotCard({ facility, slot }) {
  const status = getStatus(slot);

  const capacity = Number(slot.capacity);
  const booked = Number(slot.booked);
  const remaining = Number(slot.remaining);

  const percentage =
    Number.isFinite(capacity) &&
    capacity > 0 &&
    Number.isFinite(booked)
      ? Math.min(
          100,
          Math.round((booked / capacity) * 100)
        )
      : status === "Full"
      ? 100
      : 0;

  const timeLabel =
    slot.startTime && slot.endTime
      ? `${formatTime24(
          slot.startTime
        )} — ${formatTime24(slot.endTime)}`
      : "--";

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-3.5 transition hover:border-white/[0.1] hover:bg-white/[0.025]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-200">
            {timeLabel}
          </p>

          {slot.occupiedBy && (
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-red-400">
              {slot.occupiedBy.serviceName ||
                "Occupied"}
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${getStatusClasses(
            status
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px]">
          <span className="text-gray-600">
            {facility.type === "exclusive"
              ? "Reservation"
              : facility.type === "shared"
              ? "Playground"
              : facility.type === "movie"
              ? "Seats"
              : "Capacity"}
          </span>

          <span className="font-medium text-gray-400">
            {Number.isFinite(booked)
              ? booked
              : 0}
            /
            {Number.isFinite(capacity)
              ? capacity
              : "--"}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className={`h-full rounded-full transition-all ${
              status === "Full"
                ? "bg-red-400"
                : status === "Limited"
                ? "bg-amber-400"
                : "bg-emerald-400"
            }`}
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="text-gray-600">
            Remaining
          </span>

          <span
            className={
              remaining > 0
                ? "font-medium text-gray-400"
                : "font-medium text-red-400"
            }
          >
            {Number.isFinite(remaining)
              ? remaining
              : 0}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SCHEDULE EDIT MODAL                                                        */
/* -------------------------------------------------------------------------- */

function ScheduleEditModal({
  facility,
  onClose,
  onSave,
  saving,
}) {
  const schedule = facility.schedule;

  const initialSchedules = useMemo(() => {
    if (
      Array.isArray(facility?.schedules) &&
      facility.schedules.length > 0
    ) {
      return facility.schedules;
    }

    return [];
  }, [facility]);

  const [enabled, setEnabled] = useState(
    schedule?.active !== false
  );

  const [start, setStart] = useState(
    schedule?.startTime || "11:00"
  );

  const [end, setEnd] = useState(
    schedule?.endTime || "23:00"
  );

  const [slotMinutes, setSlotMinutes] =
    useState(
      String(
        schedule?.slotDurationMinutes || 60
      )
    );

  const [error, setError] = useState("");

  const Icon = facility.icon;

  const handleSubmit = (event) => {
    event.preventDefault();

    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    const duration = Number(slotMinutes);

    if (
      startMinutes === null ||
      endMinutes === null
    ) {
      setError("Please enter valid start and end times.");
      return;
    }

    if (startMinutes >= endMinutes) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      setError(
        "Slot duration must be greater than 0."
      );
      return;
    }

    if (
      (endMinutes - startMinutes) %
        duration !==
      0
    ) {
      setError(
        "The operating time must divide evenly into the selected slot duration."
      );
      return;
    }

    /*
     * Preserve every existing weekday schedule.
     * Only the schedule for the selected date's weekday
     * is updated.
     */
    const dayOfWeek =
      schedule?.dayOfWeek ??
      new Date(
        `${formatDateForApi(
          new Date(
            `${formatDateForApi(
              new Date()
            )}T00:00:00`
          )
        )}T00:00:00`
      ).getDay();

    const existingSchedules = initialSchedules.map(
      (item) => ({
        id: item._id || item.id,
        dayOfWeek: Number(item.dayOfWeek),
        startTime: item.startTime,
        endTime: item.endTime,
        slotDurationMinutes: Number(
          item.slotDurationMinutes
        ),
        active: item.active !== false,
      })
    );

    const nextSchedule = {
      dayOfWeek: Number(dayOfWeek),
      startTime: start,
      endTime: end,
      slotDurationMinutes: duration,
      active: enabled,
    };

    const existingIndex =
      existingSchedules.findIndex(
        (item) =>
          Number(item.dayOfWeek) ===
          Number(dayOfWeek)
      );

    let nextSchedules;

    if (existingIndex >= 0) {
      nextSchedules = existingSchedules.map(
        (item, index) =>
          index === existingIndex
            ? {
                ...item,
                ...nextSchedule,
              }
            : item
      );
    } else {
      nextSchedules = [
        ...existingSchedules,
        nextSchedule,
      ];
    }

    /*
     * The facility PATCH API expects:
     *
     * {
     *   schedules: [...]
     * }
     *
     * Mongoose can generate IDs for new schedule items.
     */
    onSave({
      schedules: nextSchedules.map(
        (item) => {
          const cleanItem = {
            dayOfWeek: Number(
              item.dayOfWeek
            ),
            startTime: item.startTime,
            endTime: item.endTime,
            slotDurationMinutes: Number(
              item.slotDurationMinutes
            ),
            active: item.active !== false,
          };

          if (item.id) {
            cleanItem.id = item.id;
          }

          return cleanItem;
        }
      ),
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07101C] shadow-2xl shadow-black/60">
        {/* MODAL HEADER */}

        <div className="flex items-start justify-between border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${getIconClasses(
                facility.color
              )}`}
            >
              <Icon size={20} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                Edit Schedule
              </p>

              <h3 className="mt-0.5 text-lg font-semibold text-white">
                {facility.displayName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-5"
        >
          <div className="mb-5 rounded-xl border border-blue-400/10 bg-blue-500/[0.04] p-3.5">
            <div className="flex gap-2.5">
              <MdInfoOutline
                size={18}
                className="mt-0.5 shrink-0 text-blue-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                This changes the recurring schedule for
                the selected weekday in the database.
                Existing bookings are not modified.
              </p>
            </div>
          </div>

          {/* ENABLE */}

          <div className="mb-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-sm font-medium text-gray-200">
                Schedule Active
              </p>

              <p className="mt-1 text-[11px] text-gray-600">
                Generate slots for this weekday.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEnabled((value) => !value)
              }
              disabled={saving}
              className={`relative h-7 w-12 rounded-full transition ${
                enabled
                  ? "bg-blue-500"
                  : "bg-white/[0.1]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label="Toggle schedule"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  enabled
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {/* TIMES */}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Time">
              <input
                type="time"
                value={start}
                onChange={(event) => {
                  setStart(
                    event.target.value
                  );
                  setError("");
                }}
                className="admin-input"
                required
                disabled={saving}
              />
            </Field>

            <Field label="End Time">
              <input
                type="time"
                value={end}
                onChange={(event) => {
                  setEnd(
                    event.target.value
                  );
                  setError("");
                }}
                className="admin-input"
                required
                disabled={saving}
              />
            </Field>
          </div>

          {/* DURATION */}

          <div className="mt-4">
            <Field label="Slot Duration">
              <div className="relative">
                <select
                  value={slotMinutes}
                  onChange={(event) => {
                    setSlotMinutes(
                      event.target.value
                    );
                    setError("");
                  }}
                  className="admin-input appearance-none pr-10"
                  disabled={saving}
                >
                  <option
                    value="30"
                    className="bg-[#07101C]"
                  >
                    30 minutes
                  </option>

                  <option
                    value="60"
                    className="bg-[#07101C]"
                  >
                    60 minutes
                  </option>

                  <option
                    value="90"
                    className="bg-[#07101C]"
                  >
                    90 minutes
                  </option>

                  <option
                    value="120"
                    className="bg-[#07101C]"
                  >
                    120 minutes
                  </option>

                  <option
                    value="180"
                    className="bg-[#07101C]"
                  >
                    180 minutes
                  </option>
                </select>

                <MdExpandMore
                  size={19}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </Field>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3 text-xs text-red-300">
              <MdWarning
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm font-medium text-gray-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <MdRefresh
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <MdSave size={18} />
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </form>

        <style jsx>{`
          .admin-input {
            width: 100%;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.025);
            padding: 0 14px;
            color: #e5e7eb;
            font-size: 13px;
            outline: none;
            transition:
              border-color 0.15s ease,
              background 0.15s ease;
          }

          .admin-input:focus {
            border-color: rgba(59, 130, 246, 0.45);
            background: rgba(255, 255, 255, 0.035);
          }

          .admin-input:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .admin-input::-webkit-calendar-picker-indicator {
            filter: invert(0.65);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INFO MODAL                                                                 */
/* -------------------------------------------------------------------------- */

function InfoModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07101C] shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-400">
              Schedule System
            </p>

            <h3 className="mt-1 text-lg font-semibold text-white">
              How it works
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <InfoRow
            number="01"
            title="Database schedules"
            text="Facility schedules are loaded directly from MongoDB. The selected date determines which weekday schedule is used."
          />

          <InfoRow
            number="02"
            title="Automatic slots"
            text="The booking-slots API generates valid slots from the facility schedule and service duration."
          />

          <InfoRow
            number="03"
            title="Live capacity"
            text="Gym, pool and combined access use their database capacity. Active pending and confirmed bookings reduce remaining availability."
          />

          <InfoRow
            number="04"
            title="Shared playground"
            text="Futsal, basketball, badminton and pickleball share the same physical playground, so overlapping bookings block the resource."
          />

          <InfoRow
            number="05"
            title="Steam & movie"
            text="Steam uses exclusive availability. Private Movie uses four fixed three-hour sessions with seat capacity."
          />

          <InfoRow
            number="06"
            title="Memberships"
            text="Monthly memberships do not use time slots and do not consume day-pass capacity."
          />

          <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.04] p-3.5">
            <div className="flex gap-2.5">
              <MdWarning
                size={18}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                Availability shown here is read from the
                backend. Final booking validation must still
                happen on the booking creation API.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INFO ROW                                                                   */
/* -------------------------------------------------------------------------- */

function InfoRow({
  number,
  title,
  text,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[9px] font-bold tracking-wider text-gray-500">
        {number}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-200">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-600">
          {text}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FIELD                                                                      */
/* -------------------------------------------------------------------------- */

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </span>

      {children}
    </label>
  );
}