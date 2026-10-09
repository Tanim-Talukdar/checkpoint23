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

const FACILITY_UI = {
  gym: {
    icon: MdFitnessCenter,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  pool: {
    icon: MdPool,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  "gym-pool": {
    icon: MdFitnessCenter,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  steam: {
    icon: FiLock,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  playground: {
    icon: MdSportsSoccer,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  movie: {
    icon: FiFilm,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
};

const SLOT_DURATIONS = [15, 30, 60, 90, 120, 180];

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-[#050A14] px-3 text-sm text-white outline-none transition focus:border-blue-400/50";

const LABEL_CLASS =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40";

function formatPrice(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function formatDuration(minutes) {
  if (!minutes) return "Membership";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatTime(time) {
  if (!time) return "--";

  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
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
  switch (service.pricingType) {
    case "monthly":
      return "Monthly membership";
    case "per_booking":
      return "Price per booking";
    case "per_ticket":
      return "Price per ticket";
    default:
      return "Price per person";
  }
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

  const schedule =
    facility.schedules.find((item) => item.active) ||
    facility.schedules[0];

  return {
    start: schedule.startTime,
    end: schedule.endTime,
    slotDuration: schedule.slotDurationMinutes,
    active: schedule.active,
  };
}

function normalizeFacility(facility) {
  const ui = FACILITY_UI[facility.slug] || {
    icon: FiSettings,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  };

  return {
    id: facility._id,
    slug: facility.slug,
    name: facility.name,
    description: facility.description || "",
    icon: ui.icon,
    iconClass: ui.color,
    iconBg: ui.bg,
    enabled: facility.active !== false,
    schedule: getPrimarySchedule(facility),
    schedules: facility.schedules || [],
    services: (facility.services || []).map((service) => ({
      id: service._id,
      name: service.name,
      slug: service.slug,
      type: service.type,
      pricingType: service.pricingType,
      price: service.price,
      capacity: service.capacity ?? null,
      duration: service.durationMinutes ?? null,
      minimum: service.minimumQuantity ?? 1,
      maximum: service.maximumQuantity ?? null,
      exclusive: service.exclusive === true,
      enabled: service.active !== false,
      priceHistory: service.priceHistory || [],
    })),
  };
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    await response.text();

    throw new Error(
      response.status === 404
        ? "Facilities API route was not found. Check the API path."
        : `Server returned an unexpected response (${response.status}).`
    );
  }

  return response.json();
}

/* -------------------------------------------------------------------------- */
/* Shared modal layout                                                        */
/* -------------------------------------------------------------------------- */

function ModalShell({
  eyebrow,
  title,
  subtitle,
  onClose,
  saving,
  children,
  onSave,
  saveLabel = "Save Changes",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#07101D] shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-white/35">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
          >
            <FiX className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
          {children}
        </div>

        <footer className="flex justify-end gap-2 border-t border-white/[0.07] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave className="h-3.5 w-3.5" />
            {saving ? "Saving..." : saveLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Service editor                                                             */
/* -------------------------------------------------------------------------- */

function ServiceEditModal({
  facility,
  service,
  onClose,
  onSave,
  saving,
}) {
  const [price, setPrice] = useState(String(service.price ?? ""));
  const [capacity, setCapacity] = useState(
    service.capacity == null ? "" : String(service.capacity)
  );
  const [duration, setDuration] = useState(
    service.duration == null ? "" : String(service.duration)
  );
  const [effectiveDate, setEffectiveDate] = useState("");
  const [enabled, setEnabled] = useState(service.enabled);
  const [validationError, setValidationError] = useState("");

  const isMembership = service.type === "membership";
  const isBooking = service.pricingType === "per_booking";
  const isMovie = service.type === "private_movie";

  async function submit() {
    const numericPrice = Number(price);
    const numericCapacity = capacity === "" ? null : Number(capacity);
    const numericDuration = duration === "" ? null : Number(duration);

    if (price.trim() === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setValidationError("Enter a valid price of zero or more.");
      return;
    }

    if (
      numericCapacity !== null &&
      (!Number.isFinite(numericCapacity) || numericCapacity < 1)
    ) {
      setValidationError("Capacity must be at least 1.");
      return;
    }

    if (
      numericDuration !== null &&
      (!Number.isFinite(numericDuration) || numericDuration < 1)
    ) {
      setValidationError("Duration must be at least 1 minute.");
      return;
    }

    setValidationError("");

    await onSave({
      ...service,
      price: numericPrice,
      capacity: numericCapacity,
      duration: numericDuration,
      enabled,
      effectiveDate: effectiveDate || null,
    });
  }

  return (
    <ModalShell
      eyebrow="Service settings"
      title={service.name}
      subtitle={facility.name}
      onClose={onClose}
      onSave={submit}
      saving={saving}
    >
      <div>
        <label className={LABEL_CLASS}>Price (BDT)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/35">
            ৳
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={`${INPUT_CLASS} pl-8`}
          />
        </div>
      </div>

      {!isMembership && (
        <div>
          <label className={LABEL_CLASS}>Duration</label>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={`${INPUT_CLASS} pl-10 pr-20`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              minutes
            </span>
          </div>
        </div>
      )}

      {!isMembership && !isBooking && (
        <div>
          <label className={LABEL_CLASS}>Capacity</label>
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className={`${INPUT_CLASS} pl-10`}
            />
          </div>
        </div>
      )}

      {isMovie && (
        <div className="rounded-2xl border border-pink-400/10 bg-pink-400/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-300/70">
            Movie ticket limits
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Minimum {service.minimum || 1}
            {service.maximum ? ` – ${service.maximum}` : ""} tickets.
            Ticket limits remain unchanged.
          </p>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Price effective from</label>
        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            className={`${INPUT_CLASS} pl-10`}
          />
        </div>
        <p className="mt-2 text-[11px] leading-5 text-white/30">
          Existing bookings retain their original charged price.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEnabled((value) => !value)}
        disabled={saving}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left disabled:opacity-50"
      >
        <div>
          <p className="text-sm font-medium text-white">Service enabled</p>
          <p className="mt-1 text-xs text-white/35">
            Control whether customers can purchase this service.
          </p>
        </div>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            enabled ? "bg-blue-500" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </span>
      </button>

      {validationError && (
        <p className="rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3 text-xs text-red-200">
          {validationError}
        </p>
      )}
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Schedule editor                                                            */
/* -------------------------------------------------------------------------- */

function ScheduleEditModal({
  facility,
  onClose,
  onSave,
  saving,
}) {
  const [start, setStart] = useState(facility.schedule.start);
  const [end, setEnd] = useState(facility.schedule.end);
  const [slotDuration, setSlotDuration] = useState(
    facility.schedule.slotDuration
      ? String(facility.schedule.slotDuration)
      : ""
  );
  const [validationError, setValidationError] = useState("");

  async function submit() {
    if (!start || !end) {
      setValidationError("Choose both opening and closing times.");
      return;
    }

    if (start >= end) {
      setValidationError("Closing time must be later than opening time.");
      return;
    }

    const numericDuration =
      slotDuration === "" ? null : Number(slotDuration);

    if (
      numericDuration !== null &&
      (!Number.isFinite(numericDuration) || numericDuration < 1)
    ) {
      setValidationError("Enter a valid slot duration.");
      return;
    }

    setValidationError("");

    await onSave({
      start,
      end,
      slotDuration: numericDuration,
    });
  }

  return (
    <ModalShell
      eyebrow="Schedule settings"
      title={facility.name}
      subtitle="Edit the recurring opening hours"
      onClose={onClose}
      onSave={submit}
      saving={saving}
      saveLabel="Save Schedule"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Opens</label>
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Closes</label>
          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {facility.slug !== "playground" && (
        <div>
          <label className={LABEL_CLASS}>Slot duration</label>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <select
              value={slotDuration}
              onChange={(event) => setSlotDuration(event.target.value)}
              className={`${INPUT_CLASS} appearance-none pl-10`}
            >
              <option value="">No fixed slot interval</option>
              {SLOT_DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatDuration(minutes)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {validationError && (
        <p className="rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3 text-xs text-red-200">
          {validationError}
        </p>
      )}
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Service card                                                               */
/* -------------------------------------------------------------------------- */

function ServiceCard({ facility, service, onEdit }) {
  const isMembership = service.type === "membership";

  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-white/[0.07] bg-[#090F1B] p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold text-white">
            {service.name}
          </h3>
          <p className="mt-1 text-xs text-white/35">
            {getServiceDescription(service)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEdit(facility, service)}
          aria-label={`Edit ${service.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/45 transition hover:border-blue-400/20 hover:bg-blue-400/10 hover:text-blue-300"
        >
          <FiEdit3 className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`mt-4 grid gap-2 ${
          isMembership ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
            Price
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {formatPrice(service.price)}
          </p>
        </div>

        {!isMembership && (
          <>
            <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
                Duration
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatDuration(service.duration)}
              </p>
            </div>

            {service.capacity != null && (
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
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

      <div className="mt-4 flex flex-wrap gap-2">
        {service.exclusive && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-400/10 bg-orange-400/[0.05] px-2 py-1 text-[10px] font-medium text-orange-300">
            <FiLock className="h-3 w-3" />
            Exclusive
          </span>
        )}

        {service.minimum > 1 && (
          <span className="rounded-lg border border-pink-400/10 bg-pink-400/[0.05] px-2 py-1 text-[10px] font-medium text-pink-300">
            Min. {service.minimum}
          </span>
        )}

        {service.maximum && (
          <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-white/50">
            Max. {service.maximum}
          </span>
        )}

        <span
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-medium ${
            service.enabled
              ? "border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300"
              : "border-red-400/10 bg-red-400/[0.05] text-red-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              service.enabled ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
          {service.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Facility card                                                              */
/* -------------------------------------------------------------------------- */

function FacilityCard({
  facility,
  onEditSchedule,
  onEditService,
}) {
  const Icon = facility.icon;

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#07101D]">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${facility.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${facility.iconClass}`} />
          </div>

          <h2 className="break-words text-base font-semibold text-white">
            {facility.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onEditSchedule(facility)}
          aria-label={`Edit ${facility.name} schedule`}
          title="Edit schedule"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:border-blue-400/20 hover:bg-blue-400/10 hover:text-blue-300 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
        >
          <FiSettings className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">
            Schedule
          </span>
        </button>
      </header>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            Services
          </h3>
          <span className="text-[10px] text-white/25">
            {facility.services.length}
          </span>
        </div>

        {facility.services.length > 0 ? (
          <div className="grid flex-1 content-start grid-cols-1 gap-3">
            {facility.services.map((service) => (
              <ServiceCard
                key={service.id}
                facility={facility}
                service={service}
                onEdit={onEditService}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.09] px-4 py-8 text-center">
            <p className="text-sm text-white/45">
              No services configured
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingService, setEditingService] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const showToast = useCallback((message) => {
    setSavedMessage(message);
  }, []);

  useEffect(() => {
    if (!savedMessage) return undefined;

    const timeout = window.setTimeout(() => {
      setSavedMessage("");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/facilites", {
        method: "GET",
        cache: "no-store",
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load facilities.");
      }

      setFacilities((data.facilities || []).map(normalizeFacility));
    } catch (requestError) {
      setError(requestError?.message || "Failed to load facilities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  /* Save service: backend endpoint and payload preserved. */

  const handleSaveService = async (facilityId, updatedService) => {
    setSaving(true);
    setError("");

    try {
      const servicePayload = {
        id: updatedService.id,
        name: updatedService.name,
        price: updatedService.price,
        capacity: updatedService.capacity,
        durationMinutes: updatedService.duration,
        minimumQuantity: updatedService.minimum,
        maximumQuantity: updatedService.maximum,
        exclusive: updatedService.exclusive,
        active: updatedService.enabled,
      };

      if (updatedService.effectiveDate) {
        servicePayload.effectiveDate = updatedService.effectiveDate;
      }

      const response = await fetch(`/api/facilites/${facilityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: servicePayload,
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save service.");
      }

      await loadFacilities();
      setEditingService(null);
      showToast(`${updatedService.name} updated`);
    } catch (requestError) {
      setError(requestError?.message || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  /* Save schedule: all seven weekly schedules are preserved. */

  const handleSaveSchedule = async (
    facilityId,
    facilityName,
    updatedSchedule
  ) => {
    setSaving(true);
    setError("");

    try {
      const facility = facilities.find((item) => item.id === facilityId);

      if (!facility) {
        throw new Error("Facility not found.");
      }

      const existingSchedules = facility.schedules || [];

      const schedules = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const existing = existingSchedules.find(
          (schedule) => schedule.dayOfWeek === dayOfWeek
        );

        return {
          id: existing?._id,
          dayOfWeek,
          startTime: updatedSchedule.start,
          endTime: updatedSchedule.end,
          slotDurationMinutes: updatedSchedule.slotDuration || 60,
          active: existing?.active !== false,
        };
      });

      const response = await fetch(`/api/facilites/${facilityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules,
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save schedule.");
      }

      await loadFacilities();
      setEditingSchedule(null);
      showToast(`${facilityName} schedule updated`);
    } catch (requestError) {
      setError(requestError?.message || "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(
    () => ({
      facilities: facilities.filter((item) => item.enabled).length,
      services: facilities.reduce(
        (total, item) => total + item.services.length,
        0
      ),
      memberships: facilities.reduce(
        (total, item) =>
          total +
          item.services.filter((service) => service.type === "membership")
            .length,
        0
      ),
    }),
    [facilities]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A14] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1800px]">
          <div className="mb-8 h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
          <div className="mb-3 h-9 w-64 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="mb-8 h-4 max-w-md animate-pulse rounded bg-white/[0.04]" />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-3xl border border-white/[0.06] bg-[#07101D]"
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
        <header className="mb-8">
          <Link
            href="/admin"
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-500/10">
                <FiSettings className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Facilities & Services
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                  Manage service pricing, capacity, availability and schedules.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                ["Facilities", summary.facilities],
                ["Services", summary.services],
                ["Memberships", summary.memberships],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#07101D] px-3 py-3 sm:min-w-24 sm:px-4"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-red-200">
                Something went wrong
              </p>
              <p className="mt-1 text-xs leading-5 text-red-200/60">
                {error}
              </p>
              <button
                type="button"
                onClick={loadFacilities}
                className="mt-2 text-xs font-semibold text-red-200 underline underline-offset-4"
              >
                Try again
              </button>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="text-red-200/50 hover:text-red-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Two facility cards per row on desktop. */}

        {facilities.length > 0 ? (
          <main className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                onEditSchedule={setEditingSchedule}
                onEditService={(selectedFacility, service) => {
                  setEditingService({
                    facility: selectedFacility,
                    service,
                  });
                }}
              />
            ))}
          </main>
        ) : (
          <div className="rounded-3xl border border-white/[0.07] bg-[#07101D] px-5 py-16 text-center">
            <FiSettings className="mx-auto h-7 w-7 text-white/25" />
            <h2 className="mt-4 text-base font-semibold text-white">
              No facilities found
            </h2>
            <p className="mt-2 text-sm text-white/40">
              No facilities were returned by the API.
            </p>
            <button
              type="button"
              onClick={loadFacilities}
              className="mt-5 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400"
            >
              Reload facilities
            </button>
          </div>
        )}

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
            Checkpoint Admin
          </p>

          <nav className="flex items-center gap-4">
            <Link
              href="/admin/live"
              className="text-xs text-white/40 transition hover:text-white"
            >
              Live Monitor
            </Link>
            <Link
              href="/admin/bookings"
              className="text-xs text-white/40 transition hover:text-white"
            >
              Bookings
            </Link>
          </nav>
        </footer>
      </div>

      {editingService && (
        <ServiceEditModal
          facility={editingService.facility}
          service={editingService.service}
          saving={saving}
          onClose={() => {
            if (!saving) setEditingService(null);
          }}
          onSave={(updatedService) =>
            handleSaveService(
              editingService.facility.id,
              updatedService
            )
          }
        />
      )}

      {editingSchedule && (
        <ScheduleEditModal
          facility={editingSchedule}
          saving={saving}
          onClose={() => {
            if (!saving) setEditingSchedule(null);
          }}
          onSave={(updatedSchedule) =>
            handleSaveSchedule(
              editingSchedule.id,
              editingSchedule.name,
              updatedSchedule
            )
          }
        />
      )}

      {savedMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border border-emerald-400/15 bg-[#07101D] px-4 py-3 shadow-2xl"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
            <FiCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Saved</p>
            <p className="mt-1 text-xs text-white/45">
              {savedMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSavedMessage("")}
            aria-label="Dismiss notification"
            className="ml-2 text-white/35 hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}