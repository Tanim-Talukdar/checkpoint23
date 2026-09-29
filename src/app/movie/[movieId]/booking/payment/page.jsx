"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiLoader, FiCreditCard } from "react-icons/fi";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent duplicate payment initialization
  const paymentStarted = useRef(false);

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setLoading(false);
      return;
    }

    // Prevent React Strict Mode from starting payment twice
    if (paymentStarted.current) {
      return;
    }

    paymentStarted.current = true;

    async function startPayment() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/payment/sslcommerz",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bookingId,
            }),
          }
        );

        let data;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Invalid response from payment server."
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Payment initialization failed."
          );
        }

        if (!data.paymentUrl) {
          throw new Error(
            "Payment gateway URL was not received."
          );
        }

        // Redirect to SSLCommerz
        window.location.replace(data.paymentUrl);
      } catch (err) {
        console.error(
          "Payment initialization error:",
          err
        );

        setError(
          err?.message ||
            "Unable to start payment. Please try again."
        );

        setLoading(false);

        // Allow retry after failure
        paymentStarted.current = false;
      }
    }

    startPayment();
  }, [bookingId]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#050A14] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white/5 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <FiCreditCard className="text-2xl text-red-400" />
          </div>

          <h1 className="text-xl font-semibold">
            Payment Could Not Start
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              paymentStarted.current = false;
              setError("");
              setLoading(true);

              window.location.reload();
            }}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050A14] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <FiCreditCard className="text-3xl text-blue-400" />
        </div>

        <h1 className="text-xl font-semibold">
          Redirecting to Payment
        </h1>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
          <FiLoader className="animate-spin" />
          <span>Please wait...</span>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          You are being securely redirected to
          SSLCommerz.
        </p>
      </div>
    </main>
  );
}