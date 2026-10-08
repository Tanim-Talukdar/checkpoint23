import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function getPaymentState(bookings) {
  if (!bookings.length) {
    return "not_found";
  }

  const allPaid = bookings.every(
    (booking) =>
      booking.paymentStatus === "paid" &&
      booking.status === "confirmed"
  );

  if (allPaid) {
    return "paid";
  }

  const allCancelled = bookings.every(
    (booking) =>
      booking.status === "cancelled" ||
      booking.paymentStatus === "failed" ||
      booking.paymentStatus === "refunded"
  );

  if (allCancelled) {
    return "failed";
  }

  return "processing";
}

function formatBooking(booking) {
  return {
    bookingReference: booking.bookingReference,
    facilityName: booking.facilityName,
    serviceName: booking.serviceName,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: booking.durationMinutes,
    quantity: booking.quantity,
    priceAtBooking: booking.priceAtBooking,
    totalAmount: booking.totalAmount,
    movieName: booking.movieName || "",
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentPaidAt: booking.paymentPaidAt || null,
  };
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const bookingGroupReference = normalizeString(
      searchParams.get("bookingGroupReference")
    ).toUpperCase();

    if (!bookingGroupReference) {
      return errorResponse(
        "Booking group reference is required.",
        400
      );
    }

    if (
      bookingGroupReference.length < 8 ||
      bookingGroupReference.length > 100
    ) {
      return errorResponse(
        "Invalid booking group reference.",
        400
      );
    }

    const bookings = await Booking.find({
      bookingGroupReference,
    })
      .select(
        [
          "bookingReference",
          "bookingGroupReference",
          "customerName",
          "facilityName",
          "serviceName",
          "bookingDate",
          "startTime",
          "endTime",
          "durationMinutes",
          "quantity",
          "priceAtBooking",
          "totalAmount",
          "movieName",
          "status",
          "paymentStatus",
          "paymentPaidAt",
          "expiresAt",
        ].join(" ")
      )
      .sort({ createdAt: 1 })
      .lean();

    if (!bookings.length) {
      return errorResponse(
        "Booking not found.",
        404
      );
    }

    const paymentState = getPaymentState(bookings);

    const totalAmount = bookings.reduce(
      (total, booking) =>
        total + Number(booking.totalAmount || 0),
      0
    );

    const paidAtValues = bookings
      .map((booking) => booking.paymentPaidAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite);

    const latestPaidAt = paidAtValues.length
      ? new Date(Math.max(...paidAtValues)).toISOString()
      : null;

    const expiresAtValues = bookings
      .map((booking) => booking.expiresAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite);

    const latestExpiresAt = expiresAtValues.length
      ? new Date(Math.max(...expiresAtValues)).toISOString()
      : null;

    return NextResponse.json({
      success: true,

      bookingGroupReference,

      paymentState,

      customer: {
        name: bookings[0].customerName,
      },

      bookings: bookings.map(formatBooking),

      totalAmount,

      currency: "BDT",

      paidAt: latestPaidAt,

      expiresAt: latestExpiresAt,
    });
  } catch (error) {
    console.error(
      "GET /api/bookings/status failed:",
      error
    );

    return errorResponse(
      "Unable to check booking status.",
      500
    );
  }
}
