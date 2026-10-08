"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit3,
  FiFilm,
  FiLock,
  FiSave,
  FiSettings,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  MdFitnessCenter,
  MdPool,
  MdSportsSoccer,
} from "react-icons/md";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const FACILITY_UI = {
  gym: {
    icon: MdFitnessCenter,
    iconClass: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },

  pool: {
    icon: MdPool,
    iconClass: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
  },

  "gym-pool": {
    icon: MdFitnessCenter,
    iconClass: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },

  steam: {
    icon: FiLock,
    iconClass: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },

  playground: {
    icon: MdSportsSoccer,
    iconClass: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },

  movie: {
    icon: FiFilm,
    iconClass: "text-pink-400",
    iconBg: "bg-pink-500/10",
  },
};

const SLOT_DURATIONS = [
  15,
  30,
  60,
  90,
  120,
  180,
];

/* ==========================================================================
   HELPERS
   ========================================================================== */

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDuration(minutes) {
  if (!minutes) {
    return "Membership";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining) {
    return `${hours}h ${remaining}m`;
  }

  return `${hours}h`;
}

function formatTime(time) {
  if (!time) return "--";

  const [hours, minutes] = time.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(
    2,
    "0"
  )} ${period}`;
}

function generateSlotPreview(start, end, duration) {
  if (!start || !end || !duration) {
    return [];
  }

  const [startHour, startMinute] = start
    .split(":")
    .map(Number);

  const [endHour, endMinute] = end
    .split(":")
    .map(Number);

  let current =
    startHour * 60 + startMinute;

  const closing =
    endHour * 60 + endMinute;

  const slots = [];

  while (current + duration <= closing) {
    const slotEnd = current + duration;

    const startHours = Math.floor(
      current / 60
    );

    const startMinutes = current % 60;

    const endHours = Math.floor(
      slotEnd / 60
    );

    const endMinutes = slotEnd % 60;

    const slotStart = `${String(
      startHours
    ).padStart(2, "0")}:${String(
      startMinutes
    ).padStart(2, "0")}`;

    const slotFinish = `${String(
      endHours
    ).padStart(2, "0")}:${String(
      endMinutes
    ).padStart(2, "0")}`;

    slots.push(
      `${formatTime(slotStart)} – ${formatTime(
        slotFinish
      )}`
    );

    current += duration;
  }

  return slots;
}

function getServiceTypeLabel(type) {
  switch (type) {
    case "membership":
      return "Membership";

    case "activity":
      return "Activity";

    case "private_movie":
      return "Movie";

    default:
      return "Day Pass";
  }
}

function getServiceDescription(service) {
  if (service.pricingType === "monthly") {
    return "Monthly membership";
  }

  if (service.pricingType === "per_booking") {
    return "Price per booking";
  }

  if (service.pricingType === "per_ticket") {
    return "Price per ticket";
  }

  return "Price per person";
}

function getPrimarySchedule(facility) {
  if (!facility?.schedules?.length) {
    return {
      start: "11:00",
      end: "23:00",
      slotDuration: null,
      active: true,
    };
  }

  const activeSchedule =
    facility.schedules.find(
      (schedule) => schedule.active
    ) || facility.schedules[0];

  return {
    start: activeSchedule.startTime,
    end: activeSchedule.endTime,
    slotDuration:
      activeSchedule.slotDurationMinutes,
    active: activeSchedule.active,
  };
}

function normalizeFacility(facility) {
  const ui =
    FACILITY_UI[facility.slug] || {
      icon: FiSettings,
      iconClass: "text-blue-400",
      iconBg: "bg-blue-500/10",
    };

  const schedule =
    getPrimarySchedule(facility);

  return {
    id: facility._id,
    slug: facility.slug,
    name: facility.name,
    description: facility.description || "",
    icon: ui.icon,
    iconClass: ui.iconClass,
    iconBg: ui.iconBg,
    enabled: facility.active !== false,

    schedule,

    schedules: facility.schedules || [],

    services: (facility.services || []).map(
      (service) => ({
        id: service._id,
        name: service.name,
        slug: service.slug,
        type: service.type,
        pricingType: service.pricingType,
        price: service.price,
        capacity:
          service.capacity ?? null,
        duration:
          service.durationMinutes ?? null,
        minimum:
          service.minimumQuantity ?? 1,
        maximum:
          service.maximumQuantity ?? null,
        exclusive:
          service.exclusive === true,
        enabled:
          service.active !== false,
        priceHistory:
          service.priceHistory || [],
      })
    ),
  };
}

/* ==========================================================================
   SERVICE EDIT MODAL
   ========================================================================== */

function ServiceEditModal({
  facility,
  service,
  onClose,
  onSave,
  saving,
}) {
  const [price, setPrice] = useState(
    String(service.price ?? "")
  );

  const [capacity, setCapacity] = useState(
    service.capacity !== null &&
      service.capacity !== undefined
      ? String(service.capacity)
      : ""
  );

  const [duration, setDuration] = useState(
    service.duration !== null &&
      service.duration !== undefined
      ? String(service.duration)
      : ""
  );

  const [effectiveDate, setEffectiveDate] =
    useState("");

  const [enabled, setEnabled] = useState(
    service.enabled
  );

  const isMembership =
    service.type === "membership";

  const isBooking =
    service.pricingType === "per_booking";

  const isMovie =
    service.type === "private_movie";

  async function submit() {
    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return;
    }

    const numericCapacity =
      capacity === ""
        ? null
        : Number(capacity);

    const numericDuration =
      duration === ""
        ? null
        : Number(duration);

    if (
      numericCapacity !== null &&
      (!Number.isFinite(numericCapacity) ||
        numericCapacity < 1)
    ) {
      return;
    }

    if (
      numericDuration !== null &&
      (!Number.isFinite(numericDuration) ||
        numericDuration < 1)
    ) {
      return;
    }

    await onSave({
      ...service,
      price: numericPrice,
      capacity: numericCapacity,
      duration: numericDuration,
      enabled,
      effectiveDate:
        effectiveDate || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#07101D] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400/80">
              Edit Service
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              {service.name}
            </h2>

            <p className="mt-1 text-xs text-white/35">
              {facility.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/40 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* PRICE */}

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Price
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/30">
                ৳
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-8 pr-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/40"
              />
            </div>
          </div>

          {/* DURATION */}

          {!isMembership && (
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                Duration
              </label>

              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-20 text-sm text-white outline-none transition focus:border-blue-400/40"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
                  minutes
                </span>
              </div>
            </div>
          )}

          {/* CAPACITY */}

          {!isMembership &&
            !isBooking && (
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Capacity
                </label>

                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(event) =>
                      setCapacity(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-3 text-sm text-white outline-none transition focus:border-blue-400/40"
                  />
                </div>
              </div>
            )}

          {/* MOVIE LIMIT INFO */}

          {isMovie && (
            <div className="rounded-2xl border border-pink-400/10 bg-pink-400/[0.035] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-300/60">
                Movie Tickets
              </p>

              <p className="mt-1 text-[11px] leading-5 text-white/30">
                Current ticket limits are{" "}
                {service.minimum || 1}
                {service.maximum
                  ? `–${service.maximum}`
                  : ""}{" "}
                tickets.
              </p>
            </div>
          )}

          {/* EFFECTIVE DATE */}

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Price Effective From
            </label>

            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

              <input
                type="date"
                value={effectiveDate}
                onChange={(event) =>
                  setEffectiveDate(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-10 pr-3 text-sm text-white outline-none transition focus:border-blue-400/40"
              />
            </div>

            <p className="mt-2 text-[11px] leading-5 text-white/25">
              The new price applies from this date.
              Existing bookings keep their original
              charged price.
            </p>
          </div>

          {/* ENABLED */}

          <button
            type="button"
            onClick={() =>
              setEnabled((value) => !value)
            }
            disabled={saving}
            className="flex w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-medium text-white">
                Service Enabled
              </p>

              <p className="mt-1 text-[11px] text-white/30">
                Customers can see and purchase this
                service.
              </p>
            </div>

            <span
              className={`relative h-6 w-11 rounded-full transition ${
                enabled
                  ? "bg-blue-500"
                  : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  enabled
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </span>
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCHEDULE EDIT MODAL
   ========================================================================== */

function ScheduleEditModal({
  facility,
  onClose,
  onSave,
  saving,
}) {
  const [start, setStart] = useState(
    facility.schedule.start
  );

  const [end, setEnd] = useState(
    facility.schedule.end
  );

  const [slotDuration, setSlotDuration] =
    useState(
      facility.schedule.slotDuration
        ? String(
            facility.schedule.slotDuration
          )
        : ""
    );

  async function submit() {
    if (!start || !end) return;

    if (start >= end) {
      return;
    }

    const numericDuration =
      slotDuration === ""
        ? null
        : Number(slotDuration);

    if (
      numericDuration !== null &&
      (!Number.isFinite(numericDuration) ||
        numericDuration < 1)
    ) {
      return;
    }

    await onSave({
      start,
      end,
      slotDuration: numericDuration,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#07101D] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400/80">
              Recurring Schedule
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              {facility.name}
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Automatically repeated every day
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/40 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                Opens
              </label>

              <input
                type="time"
                value={start}
                onChange={(event) =>
                  setStart(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/40"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                Closes
              </label>

              <input
                type="time"
                value={end}
                onChange={(event) =>
                  setEnd(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-400/40"
              />
            </div>
          </div>

          {facility.slug !== "playground" && (
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                Slot Duration
              </label>

              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                <select
                  value={slotDuration}
                  onChange={(event) =>
                    setSlotDuration(
                      event.target.value
                    )
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#050A14] pl-10 pr-3 text-sm text-white outline-none focus:border-blue-400/40"
                >
                  <option value="">
                    No fixed slot interval
                  </option>

                  {SLOT_DURATIONS.map(
                    (duration) => (
                      <option
                        key={duration}
                        value={duration}
                      >
                        {formatDuration(duration)}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-400/10 bg-blue-400/[0.035] p-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-400/10">
                <FiSettings className="h-4 w-4 text-blue-300" />
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-200/80">
                  Automatic slot generation
                </p>

                <p className="mt-1 text-[11px] leading-5 text-blue-100/35">
                  This recurring configuration is
                  applied to every day of the week.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />

            {saving
              ? "Saving..."
              : "Save Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SERVICE CARD
   ========================================================================== */

function ServiceCard({
  facility,
  service,
  onEdit,
}) {
  const isMembership =
    service.type === "membership";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              {service.name}
            </h3>

            <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
              {getServiceTypeLabel(
                service.type
              )}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-white/30">
            {getServiceDescription(service)}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onEdit(facility, service)
          }
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/35 transition hover:bg-white/[0.08] hover:text-white"
          aria-label={`Edit ${service.name}`}
        >
          <FiEdit3 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className={`mt-4 grid gap-2 ${
          isMembership
            ? "grid-cols-1"
            : "grid-cols-2 sm:grid-cols-3"
        }`}
      >
        <div className="rounded-xl border border-white/[0.05] bg-black/15 p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
            Price
          </p>

          <p className="mt-1 text-sm font-semibold text-white">
            {formatPrice(service.price)}
          </p>
        </div>

        {!isMembership && (
          <>
            <div className="rounded-xl border border-white/[0.05] bg-black/15 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                Duration
              </p>

              <p className="mt-1 text-sm font-semibold text-white">
                {formatDuration(
                  service.duration
                )}
              </p>
            </div>

            {service.capacity !== null &&
              service.capacity !== undefined && (
                <div className="rounded-xl border border-white/[0.05] bg-black/15 p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                    Capacity
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    {service.capacity}
                  </p>
                </div>
              )}
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {service.exclusive && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/10 bg-orange-400/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-300/70">
            <FiLock className="h-3 w-3" />
            Exclusive
          </span>
        )}

        {service.minimum > 1 && (
          <span className="inline-flex items-center rounded-full border border-pink-400/10 bg-pink-400/[0.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-pink-300/70">
            Minimum {service.minimum}
          </span>
        )}

        {service.maximum && (
          <span className="inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
            Max {service.maximum}
          </span>
        )}

        {service.enabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/[0.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">
            <FiCheck className="h-3 w-3" />
            Enabled
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-red-400/10 bg-red-400/[0.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-300/70">
            Disabled
          </span>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   FACILITY CARD
   ========================================================================== */

function FacilityCard({
  facility,
  onEditSchedule,
  onEditService,
}) {
  const Icon = facility.icon;

  const previewService =
    facility.services.find(
      (service) =>
        service.type !== "membership"
    );

  const generatedSlots = previewService
    ? generateSlotPreview(
        facility.schedule.start,
        facility.schedule.end,
        facility.schedule.slotDuration ||
          previewService.duration
      )
    : [];

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#07101D]">
      {/* HEADER */}

      <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${facility.iconBg}`}
          >
            <Icon
              className={`h-5 w-5 ${facility.iconClass}`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                {facility.name}
              </h2>

              {facility.enabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-emerald-300/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}

              {!facility.enabled && (
                <span className="inline-flex items-center rounded-full border border-red-400/10 bg-red-400/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-red-300/70">
                  Disabled
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-white/30">
              {facility.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onEditSchedule(facility)
          }
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[11px] font-semibold text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          <FiSettings className="h-3.5 w-3.5" />
          Edit Schedule
        </button>
      </div>

      {/* SCHEDULE */}

      <div className="border-b border-white/[0.06] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400/70">
              Recurring Daily Schedule
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                <span className="text-sm font-semibold text-white">
                  {formatTime(
                    facility.schedule.start
                  )}
                </span>
              </div>

              <span className="text-white/20">
                →
              </span>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                <span className="text-sm font-semibold text-white">
                  {formatTime(
                    facility.schedule.end
                  )}
                </span>
              </div>

              {facility.schedule
                .slotDuration && (
                <>
                  <span className="text-white/20">
                    •
                  </span>

                  <span className="text-xs text-white/35">
                    {formatDuration(
                      facility.schedule
                        .slotDuration
                    )}{" "}
                    slots
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-5 text-white/25">
              The same schedule is automatically
              generated every day.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-400/10 bg-blue-400/[0.035] px-4 py-3">
            <div className="flex items-center gap-2">
              <FiCalendar className="h-4 w-4 text-blue-300/70" />

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-blue-200/35">
                  Generation
                </p>

                <p className="mt-0.5 text-xs font-medium text-blue-100/60">
                  Automatic daily slots
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SLOT PREVIEW */}

        {generatedSlots.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Daily generated pattern
              </p>

              <p className="text-[10px] text-white/20">
                {generatedSlots.length} slots
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {generatedSlots.map(
                (slot, index) => (
                  <div
                    key={`${slot}-${index}`}
                    className="shrink-0 rounded-xl border border-white/[0.05] bg-black/15 px-3 py-2"
                  >
                    <p className="whitespace-nowrap text-[10px] font-medium text-white/45">
                      {slot}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* SERVICES */}

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Services
            </p>

            <p className="mt-1 text-xs text-white/30">
              {facility.services.length} configured{" "}
              {facility.services.length === 1
                ? "service"
                : "services"}
            </p>
          </div>

          <span className="inline-flex items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-semibold text-white/20">
            Fixed Services
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {facility.services.map(
            (service) => (
              <ServiceCard
                key={service.id}
                facility={facility}
                service={service}
                onEdit={onEditService}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SAFE JSON RESPONSE HELPER
   ========================================================================== */

/*
 * The previous code directly called response.json().
 *
 * If Next.js returns an HTML 404/500 page, response.json()
 * throws:
 *
 * Unexpected token '<'
 *
 * This helper makes the frontend show a useful error instead.
 */

async function parseJsonResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    const text = await response.text();

    throw new Error(
      response.status === 404
        ? "Facilities API route was not found. Check the API path."
        : `Server returned an unexpected response (${response.status}).`
    );
  }

  return response.json();
}

/* ==========================================================================
   PAGE
   ========================================================================== */

export default function FacilitiesPage() {
  const [facilities, setFacilities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editingService, setEditingService] =
    useState(null);

  const [editingSchedule, setEditingSchedule] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState("");

  const showToast = useCallback(
    (message) => {
      setSavedMessage(message);

      window.setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    },
    []
  );

  /* ========================================================================
     LOAD FACILITIES
     ======================================================================== */

  const loadFacilities = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        /*
         * IMPORTANT:
         *
         * Your actual API is:
         *
         * src/app/api/facilites/route.js
         *
         * Therefore the browser URL is:
         *
         * /api/facilites
         *
         * NOT:
         *
         * /api/admin/facilities
         */

        const response = await fetch(
          "/api/facilites",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          await parseJsonResponse(response);

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load facilities."
          );
        }

        const normalized =
          (data.facilities || []).map(
            normalizeFacility
          );

        setFacilities(normalized);
      } catch (requestError) {
        setError(
          requestError?.message ||
            "Failed to load facilities."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  /* ========================================================================
     SAVE SERVICE
     ======================================================================== */

  const handleSaveService = async (
    facilityId,
    updatedService
  ) => {
    setSaving(true);
    setError("");

    try {
      /*
       * IMPORTANT:
       *
       * The backend expects:
       *
       * {
       *   service: {
       *     id: ...
       *   }
       * }
       *
       * NOT:
       *
       * {
       *   services: [...]
       * }
       */

      const servicePayload = {
        id: updatedService.id,

        name: updatedService.name,

        price: updatedService.price,

        capacity:
          updatedService.capacity,

        durationMinutes:
          updatedService.duration,

        minimumQuantity:
          updatedService.minimum,

        maximumQuantity:
          updatedService.maximum,

        exclusive:
          updatedService.exclusive,

        active:
          updatedService.enabled,
      };

      /*
       * IMPORTANT:
       *
       * Backend expects "effectiveDate".
       *
       * The previous frontend incorrectly sent:
       *
       * priceEffectiveFrom
       */

      if (updatedService.effectiveDate) {
        servicePayload.effectiveDate =
          updatedService.effectiveDate;
      }

      const response = await fetch(
        `/api/facilites/${facilityId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            service: servicePayload,
          }),
        }
      );

      const data =
        await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save service."
        );
      }

      /*
       * Reload from the server instead of manually
       * mutating local state.
       *
       * This guarantees the frontend reflects MongoDB,
       * including backend validation/normalization.
       */

      await loadFacilities();

      setEditingService(null);

      showToast(
        `${updatedService.name} updated`
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Failed to save service."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================================
     SAVE RECURRING SCHEDULE
     ======================================================================== */

  const handleSaveSchedule = async (
    facilityId,
    facilityName,
    updatedSchedule
  ) => {
    setSaving(true);
    setError("");

    try {
      const facility =
        facilities.find(
          (item) => item.id === facilityId
        );

      if (!facility) {
        throw new Error(
          "Facility not found."
        );
      }

      /*
       * The UI represents the schedule as recurring daily.
       *
       * MongoDB stores schedules by dayOfWeek (0–6),
       * therefore update all seven weekly schedules.
       */

      const existingSchedules =
        facility.schedules || [];

      const schedules = Array.from(
        { length: 7 },
        (_, dayOfWeek) => {
          const existing =
            existingSchedules.find(
              (schedule) =>
                schedule.dayOfWeek ===
                dayOfWeek
            );

          return {
            id: existing?._id,
            dayOfWeek,
            startTime:
              updatedSchedule.start,
            endTime:
              updatedSchedule.end,
            slotDurationMinutes:
              updatedSchedule.slotDuration ||
              60,
            active:
              existing?.active !== false,
          };
        }
      );

      const response = await fetch(
        `/api/facilites/${facilityId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            schedules,
          }),
        }
      );

      const data =
        await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save schedule."
        );
      }

      await loadFacilities();

      setEditingSchedule(null);

      showToast(
        `${facilityName} schedule updated`
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Failed to save schedule."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ========================================================================
     SUMMARY
     ======================================================================== */

  const activeFacilities = useMemo(
    () =>
      facilities.filter(
        (facility) => facility.enabled
      ).length,
    [facilities]
  );

  const totalServices = useMemo(
    () =>
      facilities.reduce(
        (total, facility) =>
          total +
          facility.services.length,
        0
      ),
    [facilities]
  );

  const membershipServices = useMemo(
    () =>
      facilities.reduce(
        (total, facility) =>
          total +
          facility.services.filter(
            (service) =>
              service.type ===
              "membership"
          ).length,
        0
      ),
    [facilities]
  );

  /* ========================================================================
     LOADING
     ======================================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A14] text-white">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-7">
            <div className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />

            <div className="mt-6 h-10 w-72 animate-pulse rounded-xl bg-white/[0.05]" />

            <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-white/[0.04]" />
          </div>

          <div className="space-y-5">
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-3xl border border-white/[0.05] bg-[#07101D]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        {/* ==================================================================
           HEADER
           ================================================================== */}

        <header className="mb-7">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-500/10">
                  <FiSettings className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Facilities & Services
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                    Configure recurring facilities,
                    services, prices, capacities and
                    automatic daily slot generation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] px-4 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                  Facilities
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {activeFacilities}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] px-4 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                  Services
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {totalServices}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] px-4 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                  Memberships
                </p>

                <p className="mt-1 text-lg font-semibold text-white">
                  {membershipServices}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================================
           ERROR
           ================================================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-red-200">
                Something went wrong
              </p>

              <p className="mt-1 text-[11px] leading-5 text-red-200/50">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-200/40 transition hover:text-red-200"
              aria-label="Dismiss error"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ==================================================================
           CONFIGURATION NOTICE
           ================================================================== */}

        <div className="mb-6 rounded-3xl border border-blue-400/10 bg-blue-400/[0.035] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10">
              <FiSettings className="h-4 w-4 text-blue-300" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-blue-100/80">
                Recurring configuration
              </h2>

              <p className="mt-1 max-w-4xl text-xs leading-5 text-blue-100/35">
                Facilities and services are configured
                once and automatically repeat every day.
                Daily slots are generated from the
                recurring schedule. Price changes use an
                effective date, so existing bookings keep
                their original price.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================================
           FACILITIES
           ================================================================== */}

        <main className="space-y-5">
          {facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onEditSchedule={(selectedFacility) => {
                setEditingSchedule(
                  selectedFacility
                );
              }}
              onEditService={(
                selectedFacility,
                service
              ) => {
                setEditingService({
                  facility: selectedFacility,
                  service,
                });
              }}
            />
          ))}
        </main>

        {/* ==================================================================
           FOOTER
           ================================================================== */}

        <footer className="mt-7 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/20">
            Checkpoint Admin • Facilities & Services
          </p>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/live"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/30 transition hover:text-white"
            >
              Live Monitor
            </Link>

            <span className="text-white/10">
              •
            </span>

            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/30 transition hover:text-white"
            >
              Bookings
            </Link>
          </div>
        </footer>
      </div>

      {/* ====================================================================
         SERVICE MODAL
         ==================================================================== */}

      {editingService && (
        <ServiceEditModal
          facility={editingService.facility}
          service={editingService.service}
          saving={saving}
          onClose={() =>
            saving
              ? null
              : setEditingService(null)
          }
          onSave={(updatedService) => {
            const facilityId =
              editingService.facility.id;

            handleSaveService(
              facilityId,
              updatedService
            );
          }}
        />
      )}

      {/* ====================================================================
         SCHEDULE MODAL
         ==================================================================== */}

      {editingSchedule && (
        <ScheduleEditModal
          facility={editingSchedule}
          saving={saving}
          onClose={() =>
            saving
              ? null
              : setEditingSchedule(null)
          }
          onSave={(updatedSchedule) => {
            const facilityId =
              editingSchedule.id;

            const facilityName =
              editingSchedule.name;

            handleSaveSchedule(
              facilityId,
              facilityName,
              updatedSchedule
            );
          }}
        />
      )}

      {/* ====================================================================
         SAVE TOAST
         ==================================================================== */}

      {savedMessage && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-[#07101D] px-4 py-3 shadow-2xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
              <FiCheck className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <p className="text-xs font-semibold text-white">
                Saved
              </p>

              <p className="mt-0.5 text-[11px] text-white/35">
                {savedMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}