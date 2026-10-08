import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import Facility from "@/models/facility";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
];

function jsonError(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getDisplayStatus(booking) {
  switch (booking.paymentStatus) {
    case "paid":
      return "Paid";

    case "pending":
    case "unpaid":
      return "Pending";

    case "failed":
      return "Failed";

    case "refunded":
      return "Refunded";

    default:
      return "Pending";
  }
}

function getPaymentMethod(booking) {
  if (booking.paymentMethod) {
    return booking.paymentMethod;
  }

  if (booking.paymentCardType) {
    return booking.paymentCardType;
  }

  return booking.paymentTransactionId
    ? "SSLCommerz"
    : "—";
}

function getTransactionType(booking, serviceType) {
  if (serviceType === "membership") {
    return "Membership";
  }

  return "Booking";
}

function formatBookingDate(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export async function GET(request) {
  try {
    const auth = await requireAdmin();

    if (!auth.authenticated) {
      return jsonError("Admin authentication required.", 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = normalizeString(
      searchParams.get("search")
    ).toLowerCase();

    const paymentStatus = normalizeString(
      searchParams.get("status")
    ).toLowerCase();

    const type = normalizeString(
      searchParams.get("type")
    ).toLowerCase();

    const method = normalizeString(
      searchParams.get("method")
    ).toLowerCase();

    const query = {};

    if (
      paymentStatus &&
      ["unpaid", "pending", "paid", "failed", "refunded"].includes(
        paymentStatus
      )
    ) {
      query.paymentStatus = paymentStatus;
    }

    const bookings = await Booking.find(query)
      .sort({
        createdAt: -1,
      })
      .lean();

    const facilityIds = [
      ...new Set(
        bookings
          .map((booking) => booking.facilityId?.toString())
          .filter(Boolean)
      ),
    ];

    const facilities = facilityIds.length
      ? await Facility.find({
          _id: {
            $in: facilityIds,
          },
        })
          .select("_id services")
          .lean()
      : [];

    const facilityMap = new Map();

    for (const facility of facilities) {
      facilityMap.set(
        facility._id.toString(),
        facility
      );
    }

    const transactions = bookings
      .map((booking) => {
        const facility = facilityMap.get(
          booking.facilityId?.toString()
        );

        const service = facility?.services?.find(
          (item) =>
            item._id?.toString() ===
            booking.serviceId?.toString()
        );

        const transactionStatus =
          getDisplayStatus(booking);

        const transactionType =
          getTransactionType(
            booking,
            service?.type
          );

        const transactionMethod =
          getPaymentMethod(booking);

        const paymentDate =
          booking.paymentPaidAt ||
          booking.paymentInitiatedAt ||
          booking.createdAt;

        const transaction = {
          id: booking.bookingReference,

          bookingId:
            booking.bookingReference,

          bookingGroupReference:
            booking.bookingGroupReference,

          customer: booking.customerName,

          email: booking.customerEmail,

          phone: booking.customerPhone,

          service: booking.serviceName,

          facility: booking.facilityName,

          date: formatBookingDate(
            booking.bookingDate
          ),

          time:
            booking.startTime &&
            booking.endTime
              ? `${booking.startTime} - ${booking.endTime}`
              : booking.startTime || "—",

          amount: Number(
            booking.totalAmount || 0
          ),

          method: transactionMethod,

          gateway: booking.paymentTransactionId
            ? "SSLCommerz"
            : "—",

          status: transactionStatus,

          type: transactionType,

          transactionId:
            booking.paymentTransactionId || "—",

          paymentDate:
            formatBookingDate(paymentDate),

          paymentStatus:
            booking.paymentStatus,

          bookingStatus:
            booking.status,

          paymentValidationId:
            booking.paymentValidationId || "",

          paymentBankTransactionId:
            booking.paymentBankTransactionId || "",

          paymentCardType:
            booking.paymentCardType || "",

          paymentPaidAt:
            formatBookingDate(
              booking.paymentPaidAt
            ),

          createdAt:
            formatBookingDate(
              booking.createdAt
            ),
        };

        return transaction;
      })
      .filter((transaction) => {
        const matchesSearch =
          !search ||
          transaction.id
            .toLowerCase()
            .includes(search) ||
          transaction.bookingId
            .toLowerCase()
            .includes(search) ||
          transaction.bookingGroupReference
            .toLowerCase()
            .includes(search) ||
          transaction.customer
            .toLowerCase()
            .includes(search) ||
          transaction.email
            .toLowerCase()
            .includes(search) ||
          transaction.phone
            .toLowerCase()
            .includes(search) ||
          transaction.service
            .toLowerCase()
            .includes(search) ||
          transaction.transactionId
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          !paymentStatus ||
          transaction.paymentStatus ===
            paymentStatus;

        const matchesType =
          !type ||
          transaction.type.toLowerCase() ===
            type;

        const matchesMethod =
          !method ||
          transaction.method.toLowerCase() ===
            method;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesMethod
        );
      });

    const summary = {
      total: transactions.length,

      paid: transactions.filter(
        (transaction) =>
          transaction.paymentStatus === "paid"
      ).length,

      paidAmount: transactions
        .filter(
          (transaction) =>
            transaction.paymentStatus === "paid"
        )
        .reduce(
          (sum, transaction) =>
            sum + transaction.amount,
          0
        ),

      pending: transactions.filter(
        (transaction) =>
          transaction.paymentStatus ===
            "pending" ||
          transaction.paymentStatus ===
            "unpaid"
      ).length,

      pendingAmount: transactions
        .filter(
          (transaction) =>
            transaction.paymentStatus ===
              "pending" ||
            transaction.paymentStatus ===
              "unpaid"
        )
        .reduce(
          (sum, transaction) =>
            sum + transaction.amount,
          0
        ),

      failed: transactions.filter(
        (transaction) =>
          transaction.paymentStatus === "failed"
      ).length,

      refunded: transactions.filter(
        (transaction) =>
          transaction.paymentStatus ===
          "refunded"
      ).length,
    };

    return NextResponse.json({
      success: true,
      transactions,
      summary,
      total: transactions.length,
    });
  } catch (error) {
    console.error(
      "GET /api/payment failed:",
      error
    );

    return jsonError(
      "Unable to load payment transactions.",
      500
    );
  }
}