"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiCopy,
  FiCreditCard,
  FiLoader,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import {
  MdFitnessCenter,
  MdPool,
} from "react-icons/md";

/* ==========================================================================
   MEMBERSHIP RULES

   Backend is the source of truth.

   - Gym: ৳4,000/month
   - Swimming Pool: ৳4,000/month
   - Gym + Pool: ৳6,000/month
   - 11 AM – 11 PM
   - One entry per day
   - No re-entry
   - Membership does not consume day-pass slot capacity

   IMPORTANT:
   Payment status is NOT stored directly on Membership.
   Renewal payment status comes from renewalHistory.
   ========================================================================== */


/* ==========================================================================
   HELPERS
   ========================================================================== */

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "৳0";
  }

  return `৳${number.toLocaleString("en-BD")}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });
}

function getMembershipIcon(type) {
  if (type === "Swimming Pool") {
    return MdPool;
  }

  if (type === "Gym + Pool") {
    return MdFitnessCenter;
  }

  return MdFitnessCenter;
}

function getMembershipIconClass(type) {
  if (type === "Swimming Pool") {
    return "text-cyan-400";
  }

  if (type === "Gym + Pool") {
    return "text-violet-400";
  }

  return "text-blue-400";
}

function getMembershipIconBg(type) {
  if (type === "Swimming Pool") {
    return "bg-cyan-500/10";
  }

  if (type === "Gym + Pool") {
    return "bg-violet-500/10";
  }

  return "bg-blue-500/10";
}

function getStatusClasses(status) {
  switch (status) {
    case "Active":
      return "border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300/80";

    case "Upcoming":
      return "border-blue-400/10 bg-blue-400/[0.05] text-blue-300/80";

    case "Expired":
      return "border-red-400/10 bg-red-400/[0.05] text-red-300/70";

    default:
      return "border-white/[0.07] bg-white/[0.025] text-white/40";
  }
}

function getPaymentClasses(status) {
  switch (status) {
    case "Paid":
      return "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300/70";

    case "Pending":
      return "border-yellow-400/10 bg-yellow-400/[0.04] text-yellow-300/70";

    case "Failed":
      return "border-red-400/10 bg-red-400/[0.04] text-red-300/70";

    default:
      return "border-white/[0.07] bg-white/[0.025] text-white/35";
  }
}

function mapMembershipType(type) {
  switch (type) {
    case "gym":
      return "Gym";

    case "pool":
      return "Swimming Pool";

    case "gym_pool":
      return "Gym + Pool";

    default:
      return type || "Unknown";
  }
}

function mapApiMembership(membership) {
  return {
    ...membership,

    id: membership.id,

    code: membership.code,

    customer: membership.customer,

    email: membership.email,

    phone: membership.phone,

    type: mapMembershipType(
      membership.type
    ),

    price: membership.price,

    startDate: membership.startDate,

    expiryDate: membership.expiryDate,

    status:
      membership.status === "active"
        ? "Active"
        : membership.status === "upcoming"
          ? "Upcoming"
          : "Expired",

    todayEntry:
      membership.todayEntry
        ? "Used"
        : membership.status === "active"
          ? "Not Used"
          : "—",

    todayEntryTime:
      membership.todayEntryTime || null,

    totalEntries:
      Number(membership.totalEntries) || 0,

    lastEntry:
      membership.lastEntry || null,

    lastRenewedAt:
      membership.lastRenewedAt || null,

    renewalCount:
      Number(membership.renewalCount) || 0,

    lastRenewal:
      membership.lastRenewal || null,

    notes:
      membership.notes || "",
  };
}


/* ==========================================================================
   RENEW MEMBERSHIP MODAL
   ========================================================================== */

function RenewMembershipModal({
  membership,
  onClose,
  onConfirm,
  loading,
}) {
  const [error, setError] = useState("");

  if (!membership) {
    return null;
  }

  const Icon = getMembershipIcon(
    membership.type
  );

  const iconClass =
    getMembershipIconClass(
      membership.type
    );

  const iconBg =
    getMembershipIconBg(
      membership.type
    );

  const renewalPrice =
    membership.type === "Gym + Pool"
      ? 6000
      : 4000;

  const handleConfirm = async () => {
    setError("");

    try {
      await onConfirm();
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Failed to renew membership."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#07101D] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
            >
              <Icon
                className={`h-5 w-5 ${iconClass}`}
              />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400/70">
                Renew Membership
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                {membership.customer}
              </h2>

              <p className="mt-1 font-mono text-[10px] text-white/25">
                {membership.code}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/40 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close renewal modal"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* PLAN */}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Membership Plan
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {membership.type}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Renewal Amount
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatPrice(
                    renewalPrice
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* PERIOD */}

          <div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Membership Period
            </p>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20">
                    New Start
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    Today
                  </p>
                </div>

                <FiArrowLeft className="h-4 w-4 rotate-180 text-white/15" />

                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20">
                    New Expiry
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    Calculated by server
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-2 text-[10px] text-white/20">
              The server determines the exact Bangladesh
              calendar dates. Dates cannot be changed from
              the browser.
            </p>
          </div>

          {/* PAYMENT NOTICE */}

          <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4">
            <div className="flex items-start gap-3">
              <FiCreditCard className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300/60" />

              <div>
                <p className="text-xs font-semibold text-yellow-100/70">
                  Renewal payment
                </p>

                <p className="mt-1 text-[10px] leading-5 text-yellow-100/30">
                  The membership will be activated and
                  the renewal will be recorded as
                  <span className="mx-1 font-semibold text-yellow-200/60">
                    Pending
                  </span>
                  until the actual SSLCOMMERZ membership
                  payment flow is connected.
                </p>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2.5 text-[11px] text-red-300/70">
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiRefreshCw className="h-3.5 w-3.5" />
            )}

            {loading
              ? "Renewing..."
              : "Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   MEMBERSHIP DETAILS MODAL
   ========================================================================== */

function MembershipDetailsModal({
  membership,
  onClose,
  onCheckIn,
  onRenew,
  checkingIn,
}) {
  if (!membership) {
    return null;
  }

  const Icon = getMembershipIcon(
    membership.type
  );

  const iconClass =
    getMembershipIconClass(
      membership.type
    );

  const iconBg =
    getMembershipIconBg(
      membership.type
    );

  const canCheckIn =
    membership.status === "Active" &&
    membership.todayEntry === "Not Used" &&
    !checkingIn;

  const renewalPaymentStatus =
    membership.lastRenewal?.paymentStatus
      ? membership.lastRenewal.paymentStatus
          .charAt(0)
          .toUpperCase() +
        membership.lastRenewal.paymentStatus.slice(
          1
        )
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#07101D] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
            >
              <Icon
                className={`h-5 w-5 ${iconClass}`}
              />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-400/70">
                Membership Details
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  {membership.code}
                </h2>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(
                    membership.status
                  )}`}
                >
                  {membership.status}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-white/40 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close membership details"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* CUSTOMER */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Customer
            </p>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                    <FiUser className="h-4 w-4 text-white/40" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {membership.customer}
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      Membership ID:{" "}
                      {membership.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-[11px] text-white/40 sm:items-end">
                  <span className="inline-flex items-center gap-2">
                    <FiMail className="h-3.5 w-3.5 text-white/25" />
                    {membership.email}
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <FiPhone className="h-3.5 w-3.5 text-white/25" />
                    {membership.phone}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* MEMBERSHIP */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Membership
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Plan
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {membership.type}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Amount
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatPrice(
                    membership.price
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Start Date
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatDate(
                    membership.startDate
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Expiry Date
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {formatDate(
                    membership.expiryDate
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* RENEWAL SUMMARY */}

          {membership.renewalCount > 0 && (
            <section>
              <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
                Renewal History
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                    Total Renewals
                  </p>

                  <p className="mt-2 text-xl font-semibold text-white">
                    {membership.renewalCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                    Last Renewed
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {formatDateTime(
                      membership.lastRenewedAt
                    )}
                  </p>
                </div>
              </div>

              {membership.lastRenewal && (
                <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white/70">
                        Latest Renewal
                      </p>

                      <p className="mt-1 text-[10px] text-white/25">
                        {formatDate(
                          membership.lastRenewal
                            .previousExpiryDate
                        )}{" "}
                        →{" "}
                        {formatDate(
                          membership.lastRenewal
                            .newExpiryDate
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] ${getPaymentClasses(
                        membership.lastRenewal
                          .paymentStatus ===
                          "paid"
                          ? "Paid"
                          : membership.lastRenewal
                                .paymentStatus ===
                              "pending"
                            ? "Pending"
                            : "Failed"
                      )}`}
                    >
                      {membership.lastRenewal.paymentStatus}
                    </span>
                  </div>

                  <p className="mt-3 text-[10px] text-white/25">
                    Renewal amount:{" "}
                    <span className="text-white/45">
                      {formatPrice(
                        membership.lastRenewal
                          .price
                      )}
                    </span>
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ACCESS RULES */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Access Rules
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <FiClock className="h-4 w-4 text-blue-400/60" />

                <p className="mt-3 text-xs font-semibold text-white/70">
                  11 AM – 11 PM
                </p>

                <p className="mt-1 text-[10px] leading-4 text-white/25">
                  Facility access hours
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <FiCheck className="h-4 w-4 text-emerald-400/60" />

                <p className="mt-3 text-xs font-semibold text-white/70">
                  One Entry / Day
                </p>

                <p className="mt-1 text-[10px] leading-4 text-white/25">
                  Daily membership entry
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <FiX className="h-4 w-4 text-orange-400/60" />

                <p className="mt-3 text-xs font-semibold text-white/70">
                  No Re-entry
                </p>

                <p className="mt-1 text-[10px] leading-4 text-white/25">
                  Entry cannot be reused
                </p>
              </div>
            </div>
          </section>

          {/* TODAY */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Today's Entry
            </p>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {membership.todayEntry}
                  </p>

                  {membership.todayEntryTime && (
                    <p className="mt-1 text-[11px] text-white/30">
                      Checked in at{" "}
                      {formatTime(
                        membership.todayEntryTime
                      )}
                    </p>
                  )}
                </div>

                {canCheckIn ? (
                  <button
                    type="button"
                    onClick={() =>
                      onCheckIn(
                        membership
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-emerald-400"
                  >
                    {checkingIn ? (
                      <FiLoader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FiCheck className="h-3.5 w-3.5" />
                    )}

                    {checkingIn
                      ? "Checking..."
                      : "Mark Used"}
                  </button>
                ) : (
                  <div
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] ${
                      membership.todayEntry ===
                      "Used"
                        ? "border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300/70"
                        : "border-white/[0.07] bg-white/[0.025] text-white/25"
                    }`}
                  >
                    {membership.todayEntry ===
                      "Used" && (
                      <FiCheck className="h-3 w-3" />
                    )}

                    {membership.todayEntry}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* HISTORY */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Usage Summary
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Total Entries
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {membership.totalEntries}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20">
                  Last Entry
                </p>

                <p className="mt-2 text-sm font-semibold text-white">
                  {membership.lastEntry
                    ? formatDateTime(
                        membership.lastEntry
                      )
                    : "No entry yet"}
                </p>
              </div>
            </div>
          </section>

          {/* PAYMENT */}

          <section>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Payment
            </p>

            <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                  <FiCreditCard className="h-4 w-4 text-white/35" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-white/70">
                    Membership Payment
                  </p>

                  <p className="mt-1 text-[10px] text-white/25">
                    SSLCOMMERZ payment status
                  </p>
                </div>
              </div>

              {renewalPaymentStatus ? (
                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] ${getPaymentClasses(
                    renewalPaymentStatus
                  )}`}
                >
                  {renewalPaymentStatus}
                </span>
              ) : (
                <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-white/30">
                  Not Connected
                </span>
              )}
            </div>
          </section>

          {/* EXPIRED RENEWAL */}

          {membership.status ===
            "Expired" && (
            <section>
              <button
                type="button"
                onClick={() =>
                  onRenew(membership)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-400"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                Renew Membership
              </button>
            </section>
          )}
        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-xs font-semibold text-white/45 transition hover:bg-white/[0.06] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   MEMBERSHIP ROW
   ========================================================================== */

function MembershipRow({
  membership,
  onView,
  onCheckIn,
  onRenew,
  checkingInId,
}) {
  const Icon = getMembershipIcon(
    membership.type
  );

  const iconClass =
    getMembershipIconClass(
      membership.type
    );

  const iconBg =
    getMembershipIconBg(
      membership.type
    );

  const canCheckIn =
    membership.status === "Active" &&
    membership.todayEntry === "Not Used";

  const isCheckingIn =
    checkingInId === membership.id;

  return (
    <div className="group border-b border-white/[0.05] px-4 py-4 last:border-b-0 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_150px_120px_140px_150px_34px] lg:items-center">
        {/* CUSTOMER */}

        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon
              className={`h-4 w-4 ${iconClass}`}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {membership.customer}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-blue-300/50">
                {membership.code}
              </span>

              <span className="text-white/10">
                •
              </span>

              <span className="truncate text-[10px] text-white/25">
                {membership.email}
              </span>
            </div>
          </div>
        </div>

        {/* PLAN */}

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20 lg:hidden">
            Plan
          </p>

          <p className="mt-1 text-xs font-medium text-white/60 lg:mt-0">
            {membership.type}
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            {formatPrice(
              membership.price
            )}
          </p>
        </div>

        {/* VALIDITY */}

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20 lg:hidden">
            Validity
          </p>

          <p className="mt-1 text-xs text-white/55 lg:mt-0">
            {formatDate(
              membership.startDate
            )}
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            →{" "}
            {formatDate(
              membership.expiryDate
            )}
          </p>
        </div>

        {/* STATUS */}

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20 lg:hidden">
            Status
          </p>

          <div className="mt-1 flex flex-wrap gap-1.5 lg:mt-0">
            <span
              className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.11em] ${getStatusClasses(
                membership.status
              )}`}
            >
              {membership.status}
            </span>

            {membership.lastRenewal
              ?.paymentStatus && (
              <span
                className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.11em] ${getPaymentClasses(
                  membership
                    .lastRenewal
                    .paymentStatus ===
                    "paid"
                    ? "Paid"
                    : membership
                          .lastRenewal
                          .paymentStatus ===
                        "pending"
                      ? "Pending"
                      : "Failed"
                )}`}
              >
                {membership
                  .lastRenewal
                  .paymentStatus}
              </span>
            )}
          </div>
        </div>

        {/* TODAY */}

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20 lg:hidden">
            Today's Entry
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 lg:mt-0">
            {membership.todayEntry ===
            "Used" ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-300/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10">
                  <FiCheck className="h-3 w-3 text-emerald-300/80" />
                </span>

                Used
              </span>
            ) : canCheckIn ? (
              <button
                type="button"
                onClick={() =>
                  onCheckIn(
                    membership
                  )
                }
                disabled={
                  isCheckingIn
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/10 bg-blue-400/[0.05] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.11em] text-blue-300/70 transition hover:border-blue-400/20 hover:bg-blue-400/[0.09] hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <FiLoader className="h-3 w-3 animate-spin" />
                ) : (
                  <FiCheck className="h-3 w-3" />
                )}

                {isCheckingIn
                  ? "Checking"
                  : "Not Used"}
              </button>
            ) : (
              <span className="text-[10px] font-medium text-white/20">
                {membership.todayEntry}
              </span>
            )}
          </div>
        </div>

        {/* VIEW */}

        <button
          type="button"
          onClick={() =>
            onView(membership)
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.025] text-white/25 transition hover:bg-white/[0.07] hover:text-white"
          aria-label={`View ${membership.customer}`}
        >
          <FiChevronRight className="h-4 w-4" />
        </button>

        {/* MOBILE RENEW */}

        {membership.status ===
          "Expired" && (
          <button
            type="button"
            onClick={() =>
              onRenew(membership)
            }
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-400/[0.04] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-300/70 transition hover:bg-blue-400/[0.08] hover:text-blue-200 lg:hidden"
          >
            <FiRefreshCw className="h-3 w-3" />
            Renew Membership
          </button>
        )}
      </div>

      {/* DESKTOP EXPIRED RENEWAL */}

      {membership.status ===
        "Expired" && (
        <div className="mt-3 hidden justify-end lg:flex">
          <button
            type="button"
            onClick={() =>
              onRenew(membership)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-blue-400/10 bg-blue-400/[0.04] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-300/70 transition hover:bg-blue-400/[0.08] hover:text-blue-200"
          >
            <FiRefreshCw className="h-3 w-3" />
            Renew Membership
          </button>
        </div>
      )}
    </div>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function MembershipsPage() {
  const [memberships, setMemberships] =
    useState([]);

  const [summary, setSummary] =
    useState({
      totalMemberships: 0,
      active: 0,
      upcoming: 0,
      expired: 0,
      paidValue: 0,
    });

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("All Types");

  const [statusFilter, setStatusFilter] =
    useState("All Statuses");

  const [selectedMembership, setSelectedMembership] =
    useState(null);

  const [renewingMembership, setRenewingMembership] =
    useState(null);

  const [copiedCode, setCopiedCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [error, setError] =
    useState("");

  const [checkingInId, setCheckingInId] =
    useState("");

  const [renewing, setRenewing] =
    useState(false);

  const [toast, setToast] =
    useState(null);

  /* ========================================================================
     TOAST
     ======================================================================== */

  const showToast = useCallback(
    (message, type = "success") => {
      setToast({
        message,
        type,
      });

      window.setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    []
  );

  /* ========================================================================
     LOAD MEMBERSHIPS
     ======================================================================== */

  const loadMemberships =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/memberships?limit=100",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load memberships."
          );
        }

        const mappedMemberships =
          Array.isArray(
            data.memberships
          )
            ? data.memberships.map(
                mapApiMembership
              )
            : [];

        setMemberships(
          mappedMemberships
        );

        setSummary(
          data.summary || {
            totalMemberships:
              mappedMemberships.length,
            active:
              mappedMemberships.filter(
                (item) =>
                  item.status ===
                  "Active"
              ).length,
            upcoming:
              mappedMemberships.filter(
                (item) =>
                  item.status ===
                  "Upcoming"
              ).length,
            expired:
              mappedMemberships.filter(
                (item) =>
                  item.status ===
                  "Expired"
              ).length,
            paidValue: 0,
          }
        );
      } catch (requestError) {
        console.error(
          "Failed to load memberships:",
          requestError
        );

        setError(
          requestError?.message ||
            "Failed to load memberships."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  /* ========================================================================
     FILTERING

     Filtering is kept client-side after loading up to 100 memberships.
     The API remains the source of truth.
     ======================================================================== */

  const filteredMemberships =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return memberships.filter(
        (membership) => {
          const matchesSearch =
            !normalizedSearch ||
            membership.customer
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            membership.email
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            membership.phone
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            membership.code
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesType =
            typeFilter ===
              "All Types" ||
            membership.type ===
              typeFilter;

          const matchesStatus =
            statusFilter ===
              "All Statuses" ||
            membership.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      memberships,
      search,
      typeFilter,
      statusFilter,
    ]);

  const totalMemberships =
    summary.totalMemberships;

  const activeMemberships =
    summary.active;

  const upcomingMemberships =
    summary.upcoming;

  /*
   * Payment information is not fabricated.
   *
   * Your Membership model currently does not contain
   * a paymentStatus field, and SSLCOMMERZ membership
   * payment integration has not been connected yet.
   */
  const paidValue = 0;

  /* ========================================================================
     RESET
     ======================================================================== */

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All Types");
    setStatusFilter("All Statuses");
  };

  /* ========================================================================
     COPY CODE
     ======================================================================== */

  const copyMembershipCode =
    async (code) => {
      try {
        await navigator.clipboard.writeText(
          code
        );

        setCopiedCode(code);

        window.setTimeout(() => {
          setCopiedCode("");
        }, 1500);
      } catch {
        showToast(
          "Could not copy membership code.",
          "error"
        );
      }
    };

  /* ========================================================================
     LOAD DETAILS
     ======================================================================== */

  const openMembershipDetails =
    async (membership) => {
      /*
       * Show existing row data immediately.
       * Then replace it with the full database record.
       */
      setSelectedMembership(
        membership
      );

      try {
        setLoadingDetails(true);

        const response =
          await fetch(
            `/api/memberships/${encodeURIComponent(
              membership.id
            )}`,
            {
              method: "GET",
              cache: "no-store",
              credentials: "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load membership details."
          );
        }

        if (data?.membership) {
          setSelectedMembership(
            mapApiMembership(
              data.membership
            )
          );
        }
      } catch (requestError) {
        console.error(
          "Failed to load membership details:",
          requestError
        );

        showToast(
          requestError?.message ||
            "Failed to load membership details.",
          "error"
        );
      } finally {
        setLoadingDetails(false);
      }
    };

  /* ========================================================================
     CHECK IN
     ======================================================================== */

  const handleCheckIn =
    async (membership) => {
      if (
        !membership ||
        membership.status !==
          "Active" ||
        membership.todayEntry !==
          "Not Used"
      ) {
        return;
      }

      if (checkingInId) {
        return;
      }

      try {
        setCheckingInId(
          membership.id
        );

        const response =
          await fetch(
            `/api/memberships/${encodeURIComponent(
              membership.id
            )}/check-in`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({}),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to check in member."
          );
        }

        /*
         * Reload from backend instead of manually
         * incrementing the local counter.
         *
         * This keeps the UI consistent with the
         * database.
         */
        await loadMemberships();

        /*
         * Refresh details modal if it is open.
         */
        if (
          selectedMembership?.id ===
          membership.id
        ) {
          const detailsResponse =
            await fetch(
              `/api/memberships/${encodeURIComponent(
                membership.id
              )}`,
              {
                method: "GET",
                cache: "no-store",
                credentials:
                  "include",
              }
            );

          const detailsData =
            await detailsResponse.json();

          if (
            detailsResponse.ok &&
            detailsData?.membership
          ) {
            setSelectedMembership(
              mapApiMembership(
                detailsData.membership
              )
            );
          }
        }

        showToast(
          "Member checked in successfully.",
          "success"
        );
      } catch (requestError) {
        console.error(
          "Membership check-in failed:",
          requestError
        );

        if (
          requestError?.message
            ?.toLowerCase()
            .includes(
              "already checked in"
            )
        ) {
          await loadMemberships();
        }

        showToast(
          requestError?.message ||
            "Failed to check in member.",
          "error"
        );
      } finally {
        setCheckingInId("");
      }
    };

  /* ========================================================================
     RENEW MODAL
     ======================================================================== */

  const openRenewModal =
    (membership) => {
      setSelectedMembership(null);

      setRenewingMembership(
        membership
      );
    };

  /* ========================================================================
     RENEW MEMBERSHIP
     ======================================================================== */

  const handleRenewMembership =
    async () => {
      if (!renewingMembership) {
        return;
      }

      try {
        setRenewing(true);

        const response =
          await fetch(
            `/api/memberships/${encodeURIComponent(
              renewingMembership.id
            )}/renew`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({}),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to renew membership."
          );
        }

        setRenewingMembership(
          null
        );

        await loadMemberships();

        showToast(
          "Membership renewed successfully.",
          "success"
        );
      } catch (requestError) {
        console.error(
          "Membership renewal failed:",
          requestError
        );

        throw new Error(
          requestError?.message ||
            "Failed to renew membership."
        );
      } finally {
        setRenewing(false);
      }
    };

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
                  <FiUsers className="h-5 w-5 text-blue-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Memberships
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                    Manage customer memberships,
                    validity, payments and daily
                    facility access.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              title="Membership creation API is not connected yet"
              className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-blue-500/40 px-4 text-xs font-semibold text-white/60"
            >
              <FiUsers className="h-3.5 w-3.5" />
              New Membership
            </button>
          </div>
        </header>

        {/* ==================================================================
           ERROR
           ================================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-red-200/70">
                Could not load memberships
              </p>

              <p className="mt-1 text-[10px] leading-5 text-red-200/40">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadMemberships}
              className="shrink-0 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2 text-[10px] font-semibold text-red-200/60 transition hover:bg-red-400/[0.08] hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================================
           SUMMARY
           ================================================================== */}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                Total Memberships
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/10">
                <FiUsers className="h-3.5 w-3.5 text-blue-300" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {loading ? "—" : totalMemberships}
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              All membership records
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                Active
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
                <FiCheck className="h-3.5 w-3.5 text-emerald-300" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {loading ? "—" : activeMemberships}
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              Currently valid
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                Upcoming
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10">
                <FiCalendar className="h-3.5 w-3.5 text-cyan-300" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {loading
                ? "—"
                : upcomingMemberships}
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              Not started yet
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#07101D] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/25">
                Payment Data
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/10">
                <FiCreditCard className="h-3.5 w-3.5 text-violet-300" />
              </div>
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
              {formatPrice(paidValue)}
            </p>

            <p className="mt-1 text-[10px] text-white/25">
              SSLCOMMERZ membership payments not connected
            </p>
          </div>
        </section>

        {/* ==================================================================
           FILTERS
           ================================================================== */}

        <section className="mb-5 rounded-3xl border border-white/[0.07] bg-[#07101D] p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
            {/* SEARCH */}

            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search name, email, phone or code..."
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-black/15 pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-blue-400/30"
              />
            </div>

            {/* TYPE */}

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/[0.07] bg-[#07101D] px-3 text-xs text-white/60 outline-none focus:border-blue-400/30"
            >
              <option>
                All Types
              </option>

              <option>
                Gym
              </option>

              <option>
                Swimming Pool
              </option>

              <option>
                Gym + Pool
              </option>
            </select>

            {/* STATUS */}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/[0.07] bg-[#07101D] px-3 text-xs text-white/60 outline-none focus:border-blue-400/30"
            >
              <option>
                All Statuses
              </option>

              <option>
                Active
              </option>

              <option>
                Upcoming
              </option>

              <option>
                Expired
              </option>
            </select>

            {/* RESET */}

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-xs font-semibold text-white/35 transition hover:bg-white/[0.06] hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-white/20">
              Showing{" "}
              <span className="text-white/45">
                {filteredMemberships.length}
              </span>{" "}
              of{" "}
              <span className="text-white/45">
                {memberships.length}
              </span>{" "}
              loaded memberships
            </p>

            <p className="text-[10px] text-white/20">
              Membership access:{" "}
              <span className="text-white/35">
                11 AM – 11 PM
              </span>
            </p>
          </div>
        </section>

        {/* ==================================================================
           MEMBERSHIP TABLE
           ================================================================== */}

        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#07101D]">
          {/* DESKTOP HEADER */}

          <div className="hidden border-b border-white/[0.06] bg-white/[0.015] px-5 py-3 lg:block">
            <div className="grid grid-cols-[minmax(220px,1.5fr)_150px_120px_140px_150px_34px] items-center gap-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Customer
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Plan
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Validity
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Status
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/20">
                Today's Entry
              </p>

              <span />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="flex items-center gap-3 text-xs text-white/30">
                <FiLoader className="h-4 w-4 animate-spin" />
                Loading memberships...
              </div>
            </div>
          ) : filteredMemberships.length >
            0 ? (
            filteredMemberships.map(
              (membership) => (
                <MembershipRow
                  key={membership.id}
                  membership={
                    membership
                  }
                  onView={
                    openMembershipDetails
                  }
                  onCheckIn={
                    handleCheckIn
                  }
                  onRenew={
                    openRenewModal
                  }
                  checkingInId={
                    checkingInId
                  }
                />
              )
            )
          ) : (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                <FiSearch className="h-5 w-5 text-white/20" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-white/70">
                No memberships found
              </h3>

              <p className="mt-1 text-xs text-white/25">
                Try changing your
                search or filters.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-xs font-semibold text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* ==================================================================
           MEMBERSHIP CODE INFORMATION
           ================================================================== */}

        <section className="mt-5 rounded-3xl border border-blue-400/10 bg-blue-400/[0.03] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-400/10">
                <FiCopy className="h-4 w-4 text-blue-300" />
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-100/70">
                  Membership code format
                </p>

                <p className="mt-1 text-[11px] leading-5 text-blue-100/30">
                  Codes use the membership
                  month and a sequential
                  number starting from{" "}
                  <span className="font-mono text-blue-200/60">
                    1001
                  </span>
                  .
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                copyMembershipCode(
                  memberships[0]?.code ||
                    "OCT-1001"
                )
              }
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/10 px-4 py-2.5 font-mono text-xs text-blue-200/50 transition hover:bg-white/[0.04] hover:text-blue-200/70"
            >
              {copiedCode ? (
                <>
                  <FiCheck className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  {memberships[0]?.code ||
                    "OCT-1001"}

                  <FiCopy className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* ==================================================================
           FOOTER
           ================================================================== */}

        <footer className="mt-7 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/20">
            Checkpoint Admin • Memberships
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/facalites"
              className="text-xs font-medium text-white/30 transition hover:text-white"
            >
              Facilities
            </Link>

            <span className="text-white/10">
              •
            </span>

            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-white/30 transition hover:text-white"
            >
              Bookings
            </Link>
          </div>
        </footer>
      </div>

      {/* ====================================================================
         DETAILS MODAL
         ==================================================================== */}

      {selectedMembership && (
        <MembershipDetailsModal
          membership={
            selectedMembership
          }
          onClose={() =>
            setSelectedMembership(
              null
            )
          }
          onCheckIn={
            handleCheckIn
          }
          onRenew={
            openRenewModal
          }
          checkingIn={
            checkingInId ===
            selectedMembership.id
          }
        />
      )}

      {/* ====================================================================
         RENEW MODAL
         ==================================================================== */}

      {renewingMembership && (
        <RenewMembershipModal
          membership={
            renewingMembership
          }
          onClose={() => {
            if (!renewing) {
              setRenewingMembership(
                null
              );
            }
          }}
          onConfirm={
            handleRenewMembership
          }
          loading={renewing}
        />
      )}

      {/* ====================================================================
         TOAST
         ==================================================================== */}

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
            toast.type === "error"
              ? "border-red-400/10 bg-[#160B11] text-red-200/80"
              : "border-emerald-400/10 bg-[#07150F] text-emerald-200/80"
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {toast.type ===
            "error" ? (
              <FiX className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <FiCheck className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <p className="text-xs leading-5">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* DETAILS LOADING INDICATOR */}

      {loadingDetails && (
        <div className="pointer-events-none fixed right-5 top-5 z-[100] flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#07101D] px-3 py-2 text-[10px] text-white/40 shadow-xl">
          <FiLoader className="h-3.5 w-3.5 animate-spin" />
          Loading details...
        </div>
      )}
    </div>
  );
}