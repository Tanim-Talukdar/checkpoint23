import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce
    .number()
    .int()
    .min(5)
    .max(50)
    .default(10),

  search: z
    .string()
    .trim()
    .max(100)
    .default(""),

  movieId: z
    .string()
    .trim()
    .default(""),

  showtimeId: z
    .string()
    .trim()
    .default(""),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .default(""),

  paymentStatus: z
    .enum([
      "all",
      "pending",
      "paid",
      "failed",
      "cancelled",
    ])
    .default("all"),

  bookingStatus: z
    .enum([
      "all",
      "pending",
      "confirmed",
      "cancelled",
    ])
    .default("all"),
});

export async function GET(request) {
  try {
    // ADMIN ONLY
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

    await connectDB();

    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || "",
      movieId: searchParams.get("movieId") || "",
      showtimeId: searchParams.get("showtimeId") || "",
      date: searchParams.get("date") || "",
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
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      search,
      movieId,
      showtimeId,
      date,
      paymentStatus,
      bookingStatus,
    } = parsed.data;

    const filter = {};

    // Payment status
    if (paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    // Booking status
    if (bookingStatus !== "all") {
      filter.bookingStatus = bookingStatus;
    }

    // Movie filter
    if (movieId) {
      filter.movieId = movieId;
    }

    // Showtime filter
    if (showtimeId) {
      filter.showtimeId = showtimeId;
    }

    // Date filter
    if (date) {
      filter["showtimeSnapshot.date"] = date;
    }

    // Server-side search
    if (search) {
      filter.$or = [
        {
          "customer.name": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.email": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.phone": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "payment.tranId": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "payment.bankTranId": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "movieSnapshot.title": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "showtimeSnapshot.date": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "showtimeSnapshot.startTime": {
            $regex: search,
            $options: "i",
          },
        },

        {
          seats: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Booking.find(filter)
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
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Booking.countDocuments(filter),
    ]);

    // Snapshot first, populated data as fallback.
    const formattedPayments = payments.map(
      (booking) => ({
        ...booking,

        movie:
          booking.movieSnapshot ||
          booking.movieId ||
          null,

        showtime:
          booking.showtimeSnapshot ||
          booking.showtimeId ||
          null,
      })
    );

    // Overall statistics
    const statsResult = await Booking.aggregate([
      {
        $group: {
          _id: null,

          totalBookings: {
            $sum: 1,
          },

          paidCount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "paid",
                  ],
                },
                1,
                0,
              ],
            },
          },

          pendingCount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "pending",
                  ],
                },
                1,
                0,
              ],
            },
          },

          failedCount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "failed",
                  ],
                },
                1,
                0,
              ],
            },
          },

          cancelledCount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "cancelled",
                  ],
                },
                1,
                0,
              ],
            },
          },

          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$paymentStatus",
                    "paid",
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = statsResult[0] || {
      totalBookings: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      totalRevenue: 0,
    };

    return NextResponse.json({
      success: true,

      payments: formattedPayments,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      stats: {
        totalBookings:
          stats.totalBookings || 0,

        paidCount:
          stats.paidCount || 0,

        pendingCount:
          stats.pendingCount || 0,

        failedCount:
          stats.failedCount || 0,

        cancelledCount:
          stats.cancelledCount || 0,

        totalRevenue:
          stats.totalRevenue || 0,
      },
    });
  } catch (error) {
    console.error(
      "GET admin payments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch payment data",
      },
      { status: 500 }
    );
  }
}