import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Booking from "@/models/booking";
import BookingLock from "@/models/bookingLock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
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

    const bookingGroupReference =
      normalizeString(
        formData.get("value_a")
      ).toUpperCase();

    const query = {};

    if (bookingGroupReference) {
      query.bookingGroupReference =
        bookingGroupReference;
    } else if (tranId) {
      query.paymentTransactionId = tranId;
    }

    if (Object.keys(query).length) {
      /*
       * Only pending/unpaid bookings can be cancelled here.
       *
       * Already-paid/confirmed bookings are NEVER overwritten.
       */
      await Booking.updateMany(
        {
          ...query,
          status: "pending",
          paymentStatus: "pending",
        },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "failed",
            cancelledAt: new Date(),
            expiresAt: null,
            cancellationReason:
              "Payment cancelled by customer.",
          },
        }
      );

      /*
       * Release reservation locks.
       */
      await BookingLock.deleteMany(query);
    }

    const baseURL = getBaseURL();

    if (!baseURL) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Application base URL is not configured.",
        },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();

    if (bookingGroupReference) {
      params.set(
        "bookingGroupReference",
        bookingGroupReference
      );
    }

    if (tranId) {
      params.set("tranId", tranId);
    }

    let redirectURL =
      `${baseURL}/booking/cancelled`;

    if (params.toString()) {
      redirectURL +=
        `?${params.toString()}`;
    }

    return NextResponse.redirect(
      redirectURL,
      303
    );
  } catch (error) {
    console.error(
      "SSLCommerz cancel callback failed:",
      error
    );

    const baseURL = getBaseURL();

    if (baseURL) {
      return NextResponse.redirect(
        `${baseURL}/booking/cancelled`,
        303
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Payment cancellation callback could not be processed.",
      },
      { status: 500 }
    );
  }
}