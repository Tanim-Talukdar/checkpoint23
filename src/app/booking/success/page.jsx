
"use client";

import { Suspense } from "react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCalendar,
  FiArrowRight,
} from "react-icons/fi";

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 20;

function BookingSuccessContent() {
  const searchParams = useSearchParams();

  const bookingGroupReference =
    searchParams.get("bookingGroupReference") || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = useCallback(
    async (isPolling = false) => {
      if (!bookingGroupReference) {
        setData(null);
        setLoading(false);
        setChecking(false);
        setError("Booking reference is missing.");
        return null;
      }

      if (isPolling) {
        setChecking(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `/api/bookings/status?bookingGroupReference=${encodeURIComponent(
            bookingGroupReference
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to check booking status."
          );
        }

        setData(result);
        setError("");

        return result;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to check booking status."
        );

        return null;
      } finally {
        setLoading(false);
        setChecking(false);
      }
    },
    [bookingGroupReference]
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;

      attempts += 1;

      const result = await checkStatus(attempts > 1);

      if (cancelled) return;

      if (
        result?.paymentState === "paid" ||
        result?.paymentState === "failed"
      ) {
        return;
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        return;
      }

      timeoutId = setTimeout(poll, POLL_INTERVAL);
    };

    poll();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [checkStatus]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-16 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="text-center">
            <FiLoader className="mx-auto mb-5 h-10 w-10 animate-spin text-blue-500" />

            <p className="text-sm font-medium text-white">
              Checking your booking
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Please wait...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#030712] px-4 py-16 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl border border-white/10 bg-[#07101D] p-8 text-center">
            <FiAlertCircle className="mx-auto mb-5 h-12 w-12 text-red-400" />

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Unable to verify
            </p>

            <h1 className="mt-3 text-2xl font-semibold">
              Booking status unavailable
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
              We could not verify your booking right now.
              Please try again.
            </p>

            <button
              type="button"
              onClick={() => checkStatus(false)}
              className="mt-7 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const paymentState =
    data?.paymentState || "processing";

  const isPaid = paymentState === "paid";

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          {isPaid ? (
            <FiCheckCircle className="mx-auto h-16 w-16 text-emerald-400" />
          ) : (
            <FiClock className="mx-auto h-16 w-16 text-amber-400" />
          )}

          <p
            className={`mt-6 text-xs font-semibold uppercase tracking-[0.2em] ${
              isPaid
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {isPaid
              ? "Payment confirmed"
              : "Payment processing"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {isPaid
              ? "Your booking is confirmed"
              : "We are confirming your payment"}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-400">
            {isPaid
              ? "Your payment has been verified successfully and your booking is confirmed."
              : "Your payment return was received. SSLCommerz may still be completing payment verification. This page will check automatically."}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#07101D] p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Booking reference
              </p>

              <p className="mt-2 break-all font-mono text-sm font-semibold text-white">
                {bookingGroupReference}
              </p>
            </div>

            {checking && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiLoader className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            )}
          </div>

          {data?.customer?.name && (
            <div className="border-b border-white/10 py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Customer
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                {data.customer.name}
              </p>
            </div>
          )}

          <div className="py-6">
            <div className="mb-5 flex items-center gap-2">
              <FiCalendar className="h-4 w-4 text-blue-400" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Booking details
              </p>
            </div>

            <div className="space-y-4">
              {data?.bookings?.map((booking) => (
                <div
                  key={booking.bookingReference}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {booking.facilityName}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {booking.serviceName}
                      </p>

                      {booking.movieName && (
                        <p className="mt-1 text-xs text-gray-500">
                          Movie: {booking.movieName}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white">
                      ৳
                      {Number(
                        booking.totalAmount || 0
                      ).toLocaleString("en-BD")}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-gray-600">
                        Date
                      </p>

                      <p className="mt-1 text-gray-300">
                        {new Date(
                          booking.bookingDate
                        ).toLocaleDateString("en-BD", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">
                        Time
                      </p>

                      <p className="mt-1 text-gray-300">
                        {booking.startTime} -{" "}
                        {booking.endTime}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">
                        Quantity
                      </p>

                      <p className="mt-1 text-gray-300">
                        {booking.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">
                        Status
                      </p>

                      <p
                        className={`mt-1 font-medium ${
                          booking.status === "confirmed"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {booking.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <span className="text-sm text-gray-400">
              Total
            </span>

            <span className="text-xl font-bold text-white">
              ৳
              {Number(
                data?.totalAmount || 0
              ).toLocaleString("en-BD")}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#07101D] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
          >
            Back to home
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#030712] px-4 py-16 text-white">
          <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto mb-5 h-10 w-10 animate-spin text-blue-500" />

              <p className="text-sm text-gray-400">
                Loading booking details...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
