import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import ManualBooking from "@/models/ManualBooking";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(100).default(""),

  paymentStatus: z
    .enum(["all", "pending", "paid", "failed", "cancelled"])
    .default("all"),

  bookingStatus: z
    .enum(["all", "pending", "confirmed", "cancelled"])
    .default("all"),
});

function normalizeOnlineBooking(booking) {
  return {
    ...booking,
    recordType: "online",

    customer: {
      name: booking.customer?.name || "",
      email: booking.customer?.email || "",
      phone: booking.customer?.phone || "",
    },

    movie: booking.movieSnapshot ||
      booking.movieId || {
        title: "",
        poster: "",
      },

    showtime: booking.showtimeSnapshot ||
      booking.showtimeId || {
        date: "",
        startTime: "",
        ticketPrice: 0,
      },

    hall: booking.hallId || {
      name: booking.hallName || "Hall 1",
    },

    seats: Array.isArray(booking.seats) ? booking.seats : [],

    payment: {
      ...(booking.payment || {}),
      paymentMethod: booking.payment?.paymentMethod || "Online",
    },

    totalAmount: Number(booking.totalAmount || 0),
    paymentStatus: booking.paymentStatus || "pending",
    bookingStatus: booking.bookingStatus || "pending",
  };
}

function normalizeManualBooking(booking) {
  return {
    ...booking,
    recordType: "manual",

    customer: {
      name: booking.customerName || "",
      email: booking.email || "",
      phone: booking.phone || "",
    },

    movie: booking.movieSnapshot || {
      title:
        booking.manualMovieName ||
        booking.movieName ||
        "",
      poster: "",
    },

    showtime: booking.showtimeSnapshot || {
      date: booking.date || "",
      startTime: booking.time || "",
      ticketPrice: 0,
    },

    hall: {
      name: booking.hallName || "Hall 1",
    },

    seats: Array.isArray(booking.seats) ? booking.seats : [],

    payment: {
      ...(booking.payment || {}),
      paymentMethod: booking.paymentMethod || "Cash",
    },

    totalAmount: Number(
      booking.totalAmount ??
        booking.amount ??
        0
    ),

    paymentStatus: booking.paymentStatus || "paid",
    bookingStatus: booking.bookingStatus || "confirmed",
  };
}

function matchesSearch(booking, search) {
  if (!search) return true;

  const movieTitle =
    booking.movie?.title ||
    booking.movieSnapshot?.title ||
    booking.manualMovieName ||
    booking.movieName ||
    "";

  const values = [
    booking.bookingId,
    booking._id,

    booking.customer?.name,
    booking.customer?.email,
    booking.customer?.phone,

    booking.customerName,
    booking.email,
    booking.phone,

    movieTitle,

    booking.payment?.tranId,
    booking.payment?.bankTranId,
    booking.payment?.valId,

    booking.recordType,
    booking.bookingType,
  ];

  const target = search.toLowerCase();

  return values.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(target)
  );
}

function applyFilters(
  records,
  { search, paymentStatus, bookingStatus }
) {
  return records.filter((booking) => {
    if (
      paymentStatus !== "all" &&
      booking.paymentStatus !== paymentStatus
    ) {
      return false;
    }

    if (
      bookingStatus !== "all" &&
      booking.bookingStatus !== bookingStatus
    ) {
      return false;
    }

    return matchesSearch(booking, search);
  });
}

function calculateStats(records) {
  const stats = {
    totalBookings: records.length,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
  };

  for (const booking of records) {
    switch (booking.paymentStatus) {
      case "paid":
        stats.paidCount++;

        if (booking.bookingStatus === "confirmed") {
          stats.totalRevenue += Number(
            booking.totalAmount || 0
          );
        }
        break;

      case "pending":
        stats.pendingCount++;
        break;

      case "failed":
        stats.failedCount++;
        break;

      case "cancelled":
        stats.cancelledCount++;
        break;
    }
  }

  return stats;
}

async function getAllPaymentRecords() {
  const [onlineBookings, manualBookings] = await Promise.all([
    Booking.find({})
      .populate(
        "movieId",
        "title poster backdrop duration rating"
      )
      .populate(
        "showtimeId",
        "date startTime ticketPrice"
      )
      .populate(
        "hallId",
        "name capacity rows seatsPerRow seats"
      )
      .lean(),

    ManualBooking.find({}).lean(),
  ]);

  return [...onlineBookings.map(normalizeOnlineBooking), ...manualBookings.map(normalizeManualBooking)]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
}

export async function GET(request) {
  try {
    const auth = await requireAdmin();

    if (!auth.authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || "",
      paymentStatus:
        searchParams.get("paymentStatus") || "all",
      bookingStatus:
        searchParams.get("bookingStatus") || "all",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const {
      page,
      limit,
      search,
      paymentStatus,
      bookingStatus,
    } = parsed.data;

    const records = await getAllPaymentRecords();

    const filteredRecords = applyFilters(records, {
      search,
      paymentStatus,
      bookingStatus,
    });

    const total = filteredRecords.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    return NextResponse.json({
      success: true,

      payments: filteredRecords.slice(
        skip,
        skip + limit
      ),

      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },

      stats: calculateStats(filteredRecords),
    });
  } catch (error) {
    console.error("GET admin payments error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payment data",
      },
      { status: 500 }
    );
  }
}