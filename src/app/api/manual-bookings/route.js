import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";

import ManualBooking from "@/models/ManualBooking";
import Movie from "@/models/movie";
import Showtime from "@/models/showtime";
import Hall from "@/models/hall";
import Booking from "@/models/booking";

export const runtime = "nodejs";

const SEATS = [
  "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
  "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10",
  "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10",
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10",
  "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10",
];

const bookingSchema = z.object({
  bookingType: z.enum(["seat", "full-hall"]),

  movieId: z.string().optional(),
  showtimeId: z.string().optional(),

  movieName: z.string().trim().optional(),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Date must be YYYY-MM-DD",
    }),

  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, {
      message: "Time must be HH:mm",
    }),

  seats: z.array(z.string()).default([]),

  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required")
    .max(100),

  phone: z
    .string()
    .trim()
    .min(3, "Phone is required")
    .max(30),

  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),

  paymentMethod: z.literal("cash"),

  amount: z.number().min(0).optional(),

  totalAmount: z.number().min(0).optional(),

  notes: z
    .string()
    .trim()
    .max(1000)
    .optional(),
});

function getBangladeshDateTime() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return {
    date,
    time,
  };
}

function isPastDateTime(date, time) {
  const current = getBangladeshDateTime();

  if (date < current.date) {
    return true;
  }

  if (date === current.date && time < current.time) {
    return true;
  }

  return false;
}

async function getHall1() {
  return Hall.findOne({
    name: "Hall 1",
  });
}

/*
  GET MANUAL BOOKINGS
*/
export async function GET(request) {
  const auth = await requireAdmin();

  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const limitParam = Number(
      searchParams.get("limit") || 10
    );

    const skipParam = Number(
      searchParams.get("skip") || 0
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const limit = Math.min(
      Math.max(
        Number.isFinite(limitParam)
          ? limitParam
          : 10,
        1
      ),
      50
    );

    const skip = Math.max(
      Number.isFinite(skipParam)
        ? skipParam
        : 0,
      0
    );

    const query = {};

    if (search) {
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        escapedSearch,
        "i"
      );

      query.$or = [
        {
          bookingId: regex,
        },
        {
          customerName: regex,
        },
        {
          phone: regex,
        },
        {
          movieName: regex,
        },
        {
          manualMovieName: regex,
        },
        {
          "movieSnapshot.title": regex,
        },
      ];
    }

    const bookings =
      await ManualBooking.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit + 1)
        .lean();

    const hasMore =
      bookings.length > limit;

    if (hasMore) {
      bookings.pop();
    }

    return NextResponse.json({
      success: true,
      bookings,
      hasMore,
    });
  } catch (error) {
    console.error(
      "GET manual bookings error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load manual bookings",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  Check whether Hall 1 already has a full-hall booking
  at the exact same date and time.
*/
async function checkFullHallConflict(
  hallId,
  date,
  time
) {
  const manualFullHall =
    await ManualBooking.findOne({
      hallId,
      date,
      time,
      bookingType: "full-hall",
      bookingStatus: "confirmed",
    }).lean();

  if (manualFullHall) {
    return "Hall 1 is already fully booked for this date and time.";
  }

  const manualSeatBooking =
    await ManualBooking.findOne({
      hallId,
      date,
      time,
      bookingType: "seat",
      bookingStatus: "confirmed",
    }).lean();

  if (manualSeatBooking) {
    return "Hall 1 already has a seat booking for this date and time.";
  }

  const showtime =
    await Showtime.findOne({
      hallId,
      date,
      startTime: time,
    }).lean();

  if (showtime) {
    return "Hall 1 already has a showtime for this date and time.";
  }

  const onlineBooking =
    await Booking.findOne({
      hallId,
      "showtimeSnapshot.date": date,
      "showtimeSnapshot.startTime": time,
      bookingStatus: {
        $in: ["pending", "confirmed"],
      },
    }).lean();

  if (onlineBooking) {
    return "Hall 1 already has an online booking for this date and time.";
  }

  return null;
}

/*
  Check individual seats against:
  1. Manual seat bookings
  2. Manual full-hall bookings
  3. Existing online bookings
*/
async function checkSeatConflict({
  hallId,
  showtimeId,
  date,
  time,
  seats,
}) {
  const fullHallBooking =
    await ManualBooking.findOne({
      hallId,
      date,
      time,
      bookingType: "full-hall",
      bookingStatus: "confirmed",
    }).lean();

  if (fullHallBooking) {
    return "Hall 1 is already fully booked for this date and time.";
  }

  const manualBookings =
    await ManualBooking.find({
      hallId,
      date,
      time,
      bookingType: "seat",
      bookingStatus: "confirmed",
      seats: {
        $in: seats,
      },
    }).lean();

  const manuallyOccupied = new Set();

  for (const booking of manualBookings) {
    for (const seat of booking.seats || []) {
      manuallyOccupied.add(seat);
    }
  }

  const manualConflicts =
    seats.filter((seat) =>
      manuallyOccupied.has(seat)
    );

  if (manualConflicts.length > 0) {
    return `Seat already booked: ${manualConflicts.join(
      ", "
    )}`;
  }

  const onlineBookings =
    await Booking.find({
      showtimeId,
      hallId,
      bookingStatus: {
        $in: ["pending", "confirmed"],
      },
      seats: {
        $in: seats,
      },
    }).lean();

  const onlineOccupied = new Set();

  for (const booking of onlineBookings) {
    for (const seat of booking.seats || []) {
      onlineOccupied.add(seat);
    }
  }

  const onlineConflicts =
    seats.filter((seat) =>
      onlineOccupied.has(seat)
    );

  if (onlineConflicts.length > 0) {
    return `Seat already booked online: ${onlineConflicts.join(
      ", "
    )}`;
  }

  return null;
}

export async function POST(request) {
  const auth = await requireAdmin();

  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();

    const result =
      bookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking data",
          errors:
            result.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const data = result.data;

    await connectDB();

    const hall = await getHall1();

    if (!hall) {
      return NextResponse.json(
        {
          success: false,
          message: "Hall 1 not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      isPastDateTime(
        data.date,
        data.time
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking date and time cannot be in the past.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // SEAT BOOKING
    // ==================================================

    if (data.bookingType === "seat") {
      if (
        !data.movieId ||
        !mongoose.Types.ObjectId.isValid(
          data.movieId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Valid movie is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !data.showtimeId ||
        !mongoose.Types.ObjectId.isValid(
          data.showtimeId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Valid showtime is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !data.seats ||
        data.seats.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select at least one seat.",
          },
          {
            status: 400,
          }
        );
      }

      if (data.seats.length > 8) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum 8 seats allowed.",
          },
          {
            status: 400,
          }
        );
      }

      const uniqueSeats = [
        ...new Set(data.seats),
      ];

      if (
        uniqueSeats.length !==
        data.seats.length
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Duplicate seats are not allowed.",
          },
          {
            status: 400,
          }
        );
      }

      const invalidSeats =
        uniqueSeats.filter(
          (seat) =>
            !SEATS.includes(seat)
        );

      if (invalidSeats.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid seats: ${invalidSeats.join(
              ", "
            )}`,
          },
          {
            status: 400,
          }
        );
      }

      const movie =
        await Movie.findById(
          data.movieId
        ).lean();

      if (!movie) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Movie not found.",
          },
          {
            status: 404,
          }
        );
      }

      const showtime =
        await Showtime.findById(
          data.showtimeId
        ).lean();

      if (!showtime) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Showtime not found.",
          },
          {
            status: 404,
          }
        );
      }

      if (
        showtime.movieId.toString() !==
        data.movieId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected showtime does not belong to this movie.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        showtime.hallId.toString() !==
        hall._id.toString()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Booking must use Hall 1.",
          },
          {
            status: 400,
          }
        );
      }

      const bookingDate =
        showtime.date;

      const bookingTime =
        showtime.startTime;

      if (
        bookingDate !== data.date ||
        bookingTime !== data.time
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected date/time does not match the showtime.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        isPastDateTime(
          bookingDate,
          bookingTime
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This showtime has already passed.",
          },
          {
            status: 400,
          }
        );
      }

      const conflict =
        await checkSeatConflict({
          hallId: hall._id,
          showtimeId: showtime._id,
          date: bookingDate,
          time: bookingTime,
          seats: uniqueSeats,
        });

      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            message: conflict,
          },
          {
            status: 409,
          }
        );
      }

      const ticketPrice =
        Number(showtime.ticketPrice);

      const totalAmount =
        uniqueSeats.length *
        ticketPrice;

      const booking =
        await ManualBooking.create({
          bookingType: "seat",

          movieId: movie._id,
          showtimeId: showtime._id,

          movieSnapshot: {
            title: movie.title || "",
            poster: movie.poster || "",
            backdrop:
              movie.backdrop || "",
            duration: Number(
              movie.duration || 0
            ),
            rating: Number(
              movie.rating || 0
            ),
          },

          showtimeSnapshot: {
            date: bookingDate,
            startTime: bookingTime,
            ticketPrice,
          },

          manualMovieName: "",

          date: bookingDate,
          time: bookingTime,

          hallId: hall._id,

          seats: uniqueSeats,

          customerName:
            data.customerName,

          phone: data.phone,

          email: data.email || "",

          paymentMethod: "cash",

          totalAmount,

          bookingStatus:
            "confirmed",

          notes: data.notes || "",

          createdBy: auth.adminId
            ? auth.adminId
            : auth.admin?._id,
        });

      return NextResponse.json(
        {
          success: true,
          message:
            "Manual seat booking created successfully.",
          booking,
        },
        {
          status: 201,
        }
      );
    }

    // ==================================================
    // FULL HALL BOOKING
    // ==================================================

    if (!data.movieName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Movie name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const conflict =
      await checkFullHallConflict(
        hall._id,
        data.date,
        data.time
      );

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          message: conflict,
        },
        {
          status: 409,
        }
      );
    }

    const totalAmount =
      data.amount === undefined
        ? 2500
        : Number(data.amount);

    if (
      !Number.isFinite(
        totalAmount
      ) ||
      totalAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid booking amount.",
        },
        {
          status: 400,
        }
      );
    }

    const booking =
      await ManualBooking.create({
        bookingType: "full-hall",

        movieId: null,
        showtimeId: null,

        movieSnapshot: {
          title: "",
          poster: "",
          backdrop: "",
          duration: 0,
          rating: 0,
        },

        showtimeSnapshot: {
          date: "",
          startTime: "",
          ticketPrice: 0,
        },

        manualMovieName:
          data.movieName.trim(),

        date: data.date,
        time: data.time,

        hallId: hall._id,

        seats: [],

        customerName:
          data.customerName,

        phone: data.phone,

        email: data.email || "",

        paymentMethod: "cash",

        totalAmount,

        bookingStatus:
          "confirmed",

        notes: data.notes || "",

        createdBy: auth.adminId
          ? auth.adminId
          : auth.admin?._id,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Full hall booking created successfully.",
        booking,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST manual booking error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create manual booking.",
      },
      {
        status: 500,
      }
    );
  }
}