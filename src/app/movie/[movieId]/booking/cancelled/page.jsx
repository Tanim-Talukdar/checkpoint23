
"use client";

import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCreditCard,
  FiHome,
  FiCopy,
} from "react-icons/fi";
import { useState } from "react";

export default function CancelledPage() {
  const params = useSearchParams();
  const routeParams = useParams();

  const tranId = params.get("tranId");
  const movieId = routeParams?.movieId;

  const [copied, setCopied] = useState(false);

  const copyTransactionId = async () => {
    if (!tranId) return;

    await navigator.clipboard.writeText(tranId);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#050A14] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[85vh] max-w-3xl items-center justify-center">
        <div className="w-full">

          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-yellow-500/20 blur-2xl" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-500/10">
                <FiAlertCircle
                  className="text-yellow-400"
                  size={52}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl">

            {/* Header */}
            <div className="border-b border-white/10 px-6 py-8 text-center sm:px-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                <FiAlertCircle size={13} />
                Payment Cancelled
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Payment Was Cancelled
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                You left or cancelled the payment process before it
                could be completed.
              </p>
            </div>

            <div className="p-6 sm:p-10">

              {/* Transaction */}
              {tranId && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Payment Reference
                      </p>

                      <p className="mt-2 break-all font-mono text-sm text-slate-300">
                        {tranId}
                      </p>
                    </div>

                    <button
                      onClick={copyTransactionId}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                    >
                      <FiCopy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <FiCreditCard size={19} />
                  </div>

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Payment
                  </p>

                  <p className="mt-1 font-semibold text-yellow-400">
                    Not Completed
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <FiAlertCircle size={19} />
                  </div>

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Booking
                  </p>

                  <p className="mt-1 font-semibold text-slate-300">
                    Not Confirmed
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="font-semibold text-white">
                  Want to complete your booking?
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  You can return to the movie and select a showtime again.
                  Your booking is only confirmed after a successful
                  payment.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/movie/${movieId}/booking`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  <FiCreditCard size={17} />
                  Return to Booking
                </Link>

                <Link
                  href="/"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <FiHome size={17} />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            No booking confirmation is issued for a cancelled payment.
          </p>
        </div>
      </div>
    </main>
  );
}
