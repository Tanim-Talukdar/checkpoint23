
"use client";

import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  FiCheckCircle,
  FiHome,
  FiCalendar,
  FiMail,
  FiShield,
  FiArrowRight,
  FiCopy,
} from "react-icons/fi";
import { useState } from "react";

export default function SuccessPage() {
  const params = useSearchParams();
  const routeParams = useParams();

  const tranId = params.get("tranId");
  const movieId = routeParams?.movieId;

  const [copied, setCopied] = useState(false);

  const copyTransactionId = async () => {
    if (!tranId) return;

    await navigator.clipboard.writeText(tranId);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-[#050A14] text-white px-4 py-10">
      <div className="mx-auto flex min-h-[85vh] max-w-3xl items-center justify-center">
        <div className="w-full">

          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-green-400/20 bg-green-500/10">
                <FiCheckCircle
                  className="text-green-400"
                  size={52}
                />
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur-xl">

            {/* Header */}
            <div className="border-b border-white/10 px-6 py-8 text-center sm:px-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-400">
                <FiShield size={13} />
                Payment Verified
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Booking Confirmed
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                Your payment was successfully processed and your movie
                booking has been confirmed.
              </p>
            </div>

            {/* Transaction */}
            <div className="p-6 sm:p-10">

              <div className="rounded-2xl border border-green-400/10 bg-green-400/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Transaction ID
                    </p>

                    <p className="mt-2 break-all font-mono text-sm font-semibold text-white">
                      {tranId || "Not available"}
                    </p>
                  </div>

                  {tranId && (
                    <button
                      onClick={copyTransactionId}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <FiCopy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <FiCalendar size={19} />
                  </div>

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Booking status
                  </p>

                  <p className="mt-1 font-semibold text-green-400">
                    Confirmed
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <FiMail size={19} />
                  </div>

                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Payment status
                  </p>

                  <p className="mt-1 font-semibold text-green-400">
                    Paid
                  </p>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-6 rounded-2xl border border-blue-400/10 bg-blue-400/[0.04] p-5">
                <p className="text-sm font-semibold text-white">
                  What happens next?
                </p>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                  <li>• Keep your transaction ID for reference.</li>
                  <li>• Your booking is now confirmed.</li>
                  <li>• Present your booking information when you arrive at the cinema.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/movie/${movieId}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  View Movie
                  <FiArrowRight size={17} />
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
            Please keep your transaction ID until your visit.
          </p>
        </div>
      </div>
    </main>
  );
}
