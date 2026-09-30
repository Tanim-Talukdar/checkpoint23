import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import Showtime from "@/models/showtime";
import Hall from "@/models/hall";
import Movie from "@/models/movie";
import { checkRateLimit } from "@/lib/rateLimit";

const bookingSchema = z.object({
  movieId: z.string().min(1),
  showtimeId: z.string().min(1),
  hallId: z.string().min(1),
  seats: z.array(z.string().min(1)).min(1).max(8),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(150),
    phone: z.string().trim().min(5).max(20),
  }),
  totalAmount: z.number().min(0),
});

const INVALID_ID_MESSAGE = {
  success: false,
  message: "Invalid movie, showtime or hall ID",
};

export async function POST(request) {
  const limit = checkRateLimit(request, 5, 10 * 60 * 1000);

  if (!limit.allowed) return limit.response;

  let session;

  try {
    const validation = bookingSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking data",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { movieId, showtimeId, hallId, seats, customer } =
      validation.data;

    if (
      !mongoose.Types.ObjectId.isValid(movieId) ||
      !mongoose.Types.ObjectId.isValid(showtimeId) ||
      !mongoose.Types.ObjectId.isValid(hallId)
    ) {
      return NextResponse.json(INVALID_ID_MESSAGE, { status: 400 });
    }

    const uniqueSeats = [...new Set(seats)];

    if (uniqueSeats.length !== seats.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate seats are not allowed",
        },
        { status: 400 }
      );
    }

    await connectDB();

    session = await mongoose.startSession();

    let createdBooking;

    await session.withTransaction(async () => {
      const movie = await Movie.findById(movieId)
        .select("title poster backdrop duration rating")
        .session(session)
        .lean();

      if (!movie) throw new Error("MOVIE_NOT_FOUND");

      const showtime = await Showtime.findById(showtimeId)
        .select("movieId hallId date startTime ticketPrice")
        .session(session)
        .lean();

      if (!showtime) throw new Error("SHOWTIME_NOT_FOUND");

      if (showtime.movieId.toString() !== movieId) {
        throw new Error("SHOWTIME_MOVIE_MISMATCH");
      }

      if (showtime.hallId.toString() !== hallId) {
        throw new Error("SHOWTIME_HALL_MISMATCH");
      }

      const hall = await Hall.findById(hallId)
        .select("seats")
        .session(session)
        .lean();

      if (!hall) throw new Error("HALL_NOT_FOUND");

      const validSeats = new Set(
        (hall.seats || []).map((seat) => seat.seatNumber)
      );

      if (uniqueSeats.some((seat) => !validSeats.has(seat))) {
        throw new Error("INVALID_SEAT");
      }

      const activeBookings = await Booking.find({
        showtimeId,
        $or: [
          { bookingStatus: "confirmed" },
          {
            bookingStatus: "pending",
            paymentStatus: "pending",
            expiresAt: { $gt: new Date() },
          },
        ],
      })
        .select("seats")
        .session(session)
        .lean();

      const occupiedSeats = new Set(
        activeBookings.flatMap((booking) => booking.seats)
      );

      const alreadyBooked = uniqueSeats.filter((seat) =>
        occupiedSeats.has(seat)
      );

      if (alreadyBooked.length) {
        throw new Error(`SEATS_BOOKED:${alreadyBooked.join(",")}`);
      }

      const totalAmount =
        showtime.ticketPrice * uniqueSeats.length;

      [createdBooking] = await Booking.create(
        [
          {
            movieId,
            showtimeId,
            hallId,

            movieSnapshot: {
              title: movie.title,
              poster: movie.poster || "",
              backdrop: movie.backdrop || "",
              duration: movie.duration || 0,
              rating: movie.rating || 0,
            },

            showtimeSnapshot: {
              date: showtime.date,
              startTime: showtime.startTime,
              ticketPrice: showtime.ticketPrice,
            },

            seats: uniqueSeats,

            customer: {
              name: customer.name,
              email: customer.email.toLowerCase(),
              phone: customer.phone,
            },

            totalAmount,
            paymentStatus: "pending",
            bookingStatus: "pending",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        ],
        { session }
      );
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: {
          _id: createdBooking._id,
          movieId: createdBooking.movieId,
          showtimeId: createdBooking.showtimeId,
          hallId: createdBooking.hallId,
          seats: createdBooking.seats,
          customer: createdBooking.customer,
          totalAmount: createdBooking.totalAmount,
          paymentStatus: createdBooking.paymentStatus,
          bookingStatus: createdBooking.bookingStatus,
          expiresAt: createdBooking.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST booking error:", error);

    const message = error?.message || "";

    const errors = {
      MOVIE_NOT_FOUND: ["Movie not found", 404],
      SHOWTIME_NOT_FOUND: ["Showtime not found", 404],
      HALL_NOT_FOUND: ["Hall not found", 404],
      SHOWTIME_MOVIE_MISMATCH: [
        "Showtime does not belong to this movie",
        400,
      ],
      SHOWTIME_HALL_MISMATCH: [
        "Showtime does not belong to this hall",
        400,
      ],
      INVALID_SEAT: ["Invalid seat selected", 400],
    };

    if (errors[message]) {
      const [errorMessage, status] = errors[message];

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status }
      );
    }

    if (message.startsWith("SEATS_BOOKED:")) {
      return NextResponse.json(
        {
          success: false,
          message: "Some selected seats are already booked",
          occupiedSeats: message
            .slice("SEATS_BOOKED:".length)
            .split(","),
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
      },
      { status: 500 }
    );
  } finally {
    if (session) await session.endSession();
  }
}