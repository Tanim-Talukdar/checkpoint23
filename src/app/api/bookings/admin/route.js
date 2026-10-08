import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import Booking from "@/models/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

function jsonError(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function parsePositiveInteger(value, fallback) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return number;
}

function normalizeDate(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const [, year, month, day] = match;

  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day)
    )
  );

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function getEndDate(date) {
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 1);
  return end;
}

function serializeBooking(booking) {
  return {
    id: booking._id.toString(),

    bookingReference: booking.bookingReference,
    bookingGroupReference: booking.bookingGroupReference,

    customer: {
      name: booking.customerName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
    },

    facility: {
      id: booking.facilityId?.toString() || "",
      name: booking.facilityName,
    },

    service: {
      id: booking.serviceId?.toString() || "",
      name: booking.serviceName,
    },

    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: booking.durationMinutes,

    quantity: booking.quantity,

    movieName: booking.movieName || "",

    priceAtBooking: booking.priceAtBooking,
    totalAmount: booking.totalAmount,

    status: booking.status,
    paymentStatus: booking.paymentStatus,

    paymentTransactionId:
      booking.paymentTransactionId || "",

    paymentValidationId:
      booking.paymentValidationId || "",

    paymentBankTransactionId:
      booking.paymentBankTransactionId || "",

    paymentCardType:
      booking.paymentCardType || "",

    paymentMethod:
      booking.paymentMethod || "",

    paymentInitiatedAt:
      booking.paymentInitiatedAt || null,

    paymentPaidAt:
      booking.paymentPaidAt || null,

    expiresAt:
      booking.expiresAt || null,

    checkedIn: booking.checkedIn,
    checkedInAt: booking.checkedInAt || null,

    checkedOut: booking.checkedOut,
    checkedOutAt: booking.checkedOutAt || null,

    cancelledAt:
      booking.cancelledAt || null,

    cancellationReason:
      booking.cancellationReason || "",

    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export async function GET(request) {
  try {
    /*
     * ---------------------------------------------------------
     * ADMIN AUTHENTICATION
     * ---------------------------------------------------------
     */

    const auth = await requireAdmin();

    if (!auth.authenticated) {
      return jsonError("Unauthorized", 401);
    }

    /*
     * ---------------------------------------------------------
     * DATABASE
     * ---------------------------------------------------------
     */

    await connectDB();

    /*
     * ---------------------------------------------------------
     * QUERY PARAMETERS
     *
     * Supported:
     *
     * ?page=1
     * ?limit=50
     * ?date=2026-10-10
     * ?facilityId=...
     * ?status=pending
     * ?paymentStatus=paid
     * ?search=tanim
     * ---------------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    const page = Math.max(
      1,
      parsePositiveInteger(
        searchParams.get("page"),
        1
      )
    );

    const limit = Math.min(
      MAX_LIMIT,
      parsePositiveInteger(
        searchParams.get("limit"),
        50
      )
    );

    const dateParam =
      searchParams.get("date")?.trim() || "";

    const facilityId =
      searchParams.get("facilityId")?.trim() || "";

    const status =
      searchParams.get("status")?.trim() || "";

    const paymentStatus =
      searchParams
        .get("paymentStatus")
        ?.trim() || "";

    const search =
      searchParams.get("search")?.trim() || "";

    /*
     * ---------------------------------------------------------
     * BUILD QUERY
     * ---------------------------------------------------------
     */

    const query = {};

    /*
     * DATE FILTER
     */

    if (dateParam) {
      const startDate =
        normalizeDate(dateParam);

      if (!startDate) {
        return jsonError(
          "Invalid date. Use YYYY-MM-DD."
        );
      }

      query.bookingDate = {
        $gte: startDate,
        $lt: getEndDate(startDate),
      };
    }

    /*
     * FACILITY FILTER
     */

    if (facilityId) {
      if (!mongoose.isValidObjectId(facilityId)) {
        return jsonError(
          "Invalid facility ID."
        );
      }

      query.facilityId =
        new mongoose.Types.ObjectId(
          facilityId
        );
    }

    /*
     * BOOKING STATUS FILTER
     */

    const allowedStatuses = new Set([
      "pending",
      "confirmed",
      "completed",
      "cancelled",
    ]);

    if (status) {
      if (!allowedStatuses.has(status)) {
        return jsonError(
          "Invalid booking status."
        );
      }

      query.status = status;
    }

    /*
     * PAYMENT STATUS FILTER
     */

    const allowedPaymentStatuses =
      new Set([
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
      ]);

    if (paymentStatus) {
      if (
        !allowedPaymentStatuses.has(
          paymentStatus
        )
      ) {
        return jsonError(
          "Invalid payment status."
        );
      }

      query.paymentStatus =
        paymentStatus;
    }

    /*
     * SEARCH
     *
     * Search customer name/email/phone,
     * booking reference and group reference.
     */

    if (search) {
      const escapedSearch =
        search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const regex = new RegExp(
        escapedSearch,
        "i"
      );

      query.$or = [
        {
          bookingReference: regex,
        },
        {
          bookingGroupReference: regex,
        },
        {
          customerName: regex,
        },
        {
          customerEmail: regex,
        },
        {
          customerPhone: regex,
        },
        {
          facilityName: regex,
        },
        {
          serviceName: regex,
        },
      ];
    }

    /*
     * ---------------------------------------------------------
     * PAGINATION
     * ---------------------------------------------------------
     */

    const skip = (page - 1) * limit;

    /*
     * ---------------------------------------------------------
     * FETCH BOOKINGS + TOTAL COUNT
     * ---------------------------------------------------------
     *
     * Promise.all keeps both database operations
     * running concurrently.
     */

    const [bookings, total] =
      await Promise.all([
        Booking.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Booking.countDocuments(query),
      ]);

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     */

    const totalPages =
      Math.ceil(total / limit);

    return NextResponse.json({
      success: true,

      data: bookings.map(
        serializeBooking
      ),

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },

      filters: {
        date: dateParam || null,
        facilityId: facilityId || null,
        status: status || null,
        paymentStatus:
          paymentStatus || null,
        search: search || null,
      },
    });
  } catch (error) {
    console.error(
      "Admin bookings API error:",
      error
    );

    return jsonError(
      "Unable to load bookings.",
      500
    );
  }
}