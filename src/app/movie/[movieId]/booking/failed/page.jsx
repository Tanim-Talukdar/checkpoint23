
"use client";

import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  FiXCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiHelpCircle,
  FiCopy,
} from "react-icons/fi";
import { useState } from "react";

export default function FailedPage() {
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
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10">
                <FiXCircle
                  className="text-red-400"
                  size={52}
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl backdrop-blur-xl">

            {/* Header */}
            <div className="border-b border-white/10 px-6 py-8 text-center sm:px-10">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-400">
                <FiXCircle size={13} />
                Payment Failed
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Payment Unsuccessful
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
                We couldn't complete your payment. Your booking has not
                been confirmed.
              </p>
            </div>

            <div className="p-6 sm:p-10">

              {/* Transaction */}
              {tranId && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Transaction ID
                      </p>

                      <p className="mt-2 break-all font-mono text-sm text-slate-300">
                        {tranId}
                      </p>
                    </div>

                    <button
                      onClick={copyTransactionId}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                    >
                      <FiCopy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              {/* Possible reasons */}
              <div className="mt-6 rounded-2xl border border-red-400/10 bg-red-400/[0.035] p-5">
                <div className="flex gap-3">
                  <FiHelpCircle
                    className="mt-0.5 shrink-0 text-red-400"
                    size={20}
                  />

                  <div>
                    <p className="font-semibold text-white">
                      What may have happened?
                    </p>

                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                      <li>• Your bank declined the transaction.</li>
                      <li>• There was a temporary payment gateway issue.</li>
                      <li>• Your card or mobile banking session expired.</li>
                      <li>• The payment was interrupted before completion.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Important */}
              <div className="mt-4 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.035] p-5">
                <p className="text-sm font-semibold text-yellow-400">
                  Don't worry
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  If money was deducted from your account, don't make
                  another payment immediately. Check your bank/payment
                  provider first and keep the transaction ID.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/movie/${movieId}/booking`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-blue-500"
                >
                  <FiRefreshCw size={17} />
                  Try Payment Again
                </Link>

                <Link
                  href={`/movie/${movieId}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  <FiArrowLeft size={17} />
                  Back to Movie
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Need help? Keep your transaction ID when contacting support.
          </p>
        </div>
      </div>
    </main>
  );
}

