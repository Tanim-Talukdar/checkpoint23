
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";

export default function BookingFailedPage() {
  const searchParams = useSearchParams();

  const bookingGroupReference =
    searchParams.get("bookingGroupReference") || "";

  return (
    <main className="min-h-screen bg-[#030712] px-4 py-16 text-white">
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#07101D] p-8 text-center sm:p-10">
          <FiAlertCircle className="mx-auto h-16 w-16 text-red-400" />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
            Payment failed
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Payment was not completed
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-400">
            Your payment could not be completed. No
            successful payment has been recorded for this
            booking.
          </p>

          {bookingGroupReference && (
            <div className="mt-7 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Booking reference
              </p>

              <p className="mt-2 break-all font-mono text-sm text-white">
                {bookingGroupReference}
              </p>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
