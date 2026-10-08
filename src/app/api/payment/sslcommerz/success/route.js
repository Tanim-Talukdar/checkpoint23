import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseURL() {
  const baseURL = normalizeString(
    process.env.NEXT_PUBLIC_BASE_URL
  );

  return baseURL
    ? baseURL.replace(/\/+$/, "")
    : null;
}

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();

    const tranId = normalizeString(
      formData.get("tran_id")
    );

    const bookingGroupReference = normalizeString(
      formData.get("value_a")
    ).toUpperCase();

    const baseURL = getBaseURL();

    if (!baseURL) {
      return NextResponse.json(
        {
          success: false,
          message: "Application base URL is not configured.",
        },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT:
     *
     * The success callback itself is NOT trusted as proof
     * of payment.
     *
     * We forward the complete SSLCommerz response to the
     * same server-side IPN processor.
     *
     * That processor independently validates the transaction
     * against SSLCommerz before confirming the booking.
     */

    const ipnURL =
      `${baseURL}/api/payment/sslcommerz`;

    const ipnFormData = new FormData();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        ipnFormData.append(key, value);
      } else {
        ipnFormData.append(key, String(value));
      }
    }

    console.log(
      "========== SSL SUCCESS CALLBACK =========="
    );

    console.log({
      tranId,
      bookingGroupReference,
      forwardingToIPN: ipnURL,
    });

    let ipnResponse;

    try {
      ipnResponse = await fetch(ipnURL, {
        method: "POST",
        body: ipnFormData,
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      console.error(
        "Failed to forward SSLCommerz success data to IPN:",
        error
      );

      /*
       * The customer can still reach the success page.
       *
       * The page will show processing and continue polling
       * the booking status endpoint.
       */

      ipnResponse = null;
    }

    if (ipnResponse) {
      let ipnResult = null;

      try {
        ipnResult = await ipnResponse.json();
      } catch {
        // Ignore invalid/non-JSON IPN response.
      }

      console.log(
        "SSLCommerz IPN forwarding result:",
        {
          status: ipnResponse.status,
          ok: ipnResponse.ok,
          result: ipnResult,
        }
      );
    }

    /*
     * Redirect customer to the normal success page.
     *
     * The success page does NOT decide whether payment is valid.
     * It reads the actual booking state from the database.
     */

    let redirectURL =
      `${baseURL}/booking/success`;

    const params = new URLSearchParams();

    if (bookingGroupReference) {
      params.set(
        "bookingGroupReference",
        bookingGroupReference
      );
    }

    if (tranId) {
      params.set(
        "tranId",
        tranId
      );
    }

    if (params.toString()) {
      redirectURL += `?${params.toString()}`;
    }

    return NextResponse.redirect(
      redirectURL,
      303
    );
  } catch (error) {
    console.error(
      "SSLCommerz success callback failed:",
      error
    );

    const baseURL = getBaseURL();

    if (baseURL) {
      return NextResponse.redirect(
        `${baseURL}/booking/success`,
        303
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Payment callback could not be processed.",
      },
      { status: 500 }
    );
  }
}