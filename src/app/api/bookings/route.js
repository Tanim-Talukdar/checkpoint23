
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import Showtime from "@/models/showtime";
import Hall from "@/models/hall";
import Movie from "@/models/movie";
import { checkRateLimit } from "@/lib/rateLimit";
// Validate incoming booking request data.
const bookingSchema = z.object({
  movieId: z.string().min(1),
  showtimeId: z.string().min(1),
  hallId: z.string().min(1),

  // A customer can book between 1 and 8 seats.
  seats: z
    .array(z.string().min(1))
    .min(1)
    .max(8),

  // Customer information required for the booking.
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(150),
    phone: z.string().trim().min(5).max(20),
  }),

  // Accepted for request validation, but the final amount
  // is calculated server-side from the showtime ticket price.
  totalAmount: z.number().min(0),
});

export async function POST(request) {

  const limit = checkRateLimit(request, 5, 10 * 60 * 1000);

  if (!limit.allowed) return limit.response;


  // Start a MongoDB session so all booking operations
  // can be executed atomically inside a transaction.



  const session = await mongoose.startSession();

  try {
    // Parse the incoming request body.
    const body = await request.json();

    // Validate the request data against the booking schema.
    const validation = bookingSchema.safeParse(body);

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

    // Extract validated booking information.
    const {
      movieId,
      showtimeId,
      hallId,
      seats,
      customer,
    } = validation.data;

    // Validate that all provided IDs are valid MongoDB ObjectIds.
    if (
      !mongoose.Types.ObjectId.isValid(movieId) ||
      !mongoose.Types.ObjectId.isValid(showtimeId) ||
      !mongoose.Types.ObjectId.isValid(hallId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie, showtime or hall ID",
        },
        { status: 400 }
      );
    }

    // Remove duplicate seat selections.
    const uniqueSeats = [...new Set(seats)];

    // Reject the request if duplicate seats were submitted.
    if (uniqueSeats.length !== seats.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate seats are not allowed",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB before performing database operations.
    await connectDB();

    let createdBooking;

    // Execute the complete booking process inside a transaction
    // to prevent inconsistent booking data.
    await session.withTransaction(async () => {
      // Verify that the selected movie exists.
      const movie = await Movie.findById(movieId).session(session);

      if (!movie) {
        throw new Error("MOVIE_NOT_FOUND");
      }

      // Verify that the selected showtime exists.
      const showtime = await Showtime.findById(showtimeId).session(session);

      if (!showtime) {
        throw new Error("SHOWTIME_NOT_FOUND");
      }

      // Ensure the showtime belongs to the selected movie.
      if (showtime.movieId.toString() !== movieId) {
        throw new Error("SHOWTIME_MOVIE_MISMATCH");
      }

      // Ensure the showtime belongs to the selected hall.
      if (showtime.hallId.toString() !== hallId) {
        throw new Error("SHOWTIME_HALL_MISMATCH");
      }

      // Verify that the selected hall exists.
      const hall = await Hall.findById(hallId).session(session);

      if (!hall) {
        throw new Error("HALL_NOT_FOUND");
      }

      // Create a set containing all valid seat numbers
      // configured for the selected hall.
      const validSeats = new Set(
        (hall.seats || []).map(
          (seat) => seat.seatNumber
        )
      );

      // Check whether every requested seat actually exists
      // in the selected hall.
      const invalidSeats = uniqueSeats.filter(
        (seat) => !validSeats.has(seat)
      );

      if (invalidSeats.length > 0) {
        throw new Error("INVALID_SEAT");
      }

      const now = new Date();

      // Find seats that are currently unavailable.
      // Confirmed bookings always occupy their seats.
      // Pending bookings only occupy seats while their
      // payment/booking expiration time is still active.
      const activeBookings = await Booking.find({
        showtimeId,

        $or: [
          {
            bookingStatus: "confirmed",
          },
          {
            bookingStatus: "pending",
            paymentStatus: "pending",
            expiresAt: { $gt: now },
          },
        ],
      })
        .select("seats")
        .session(session);

      // Convert all occupied seats into a Set for fast lookup.
      const occupiedSeats = new Set(
        activeBookings.flatMap(
          (booking) => booking.seats
        )
      );

      // Determine whether any requested seats are already occupied.
      const alreadyBooked = uniqueSeats.filter(
        (seat) => occupiedSeats.has(seat)
      );

      if (alreadyBooked.length > 0) {
        throw new Error(
          `SEATS_BOOKED:${alreadyBooked.join(",")}`
        );
      }

      // Calculate the final booking amount on the server.
      // The frontend-submitted totalAmount is not trusted.
      const totalAmount =
        showtime.ticketPrice * uniqueSeats.length;

      // Create the booking inside the active transaction.
      const [booking] = await Booking.create(
        [
          {
            movieId,
            showtimeId,
            hallId,

            // Store a snapshot of important movie information.
            // This preserves historical booking data even if
            // the original movie is later edited or deleted.
            movieSnapshot: {
              title: movie.title,
              poster: movie.poster || "",
              backdrop: movie.backdrop || "",
              duration: movie.duration || 0,
              rating: movie.rating || 0,
            },

            // Store a snapshot of the showtime information
            // used when this booking was created.
            showtimeSnapshot: {
              date: showtime.date,
              startTime: showtime.startTime,
              ticketPrice: showtime.ticketPrice,
            },

            // Store only the unique seat selections.
            seats: uniqueSeats,

            // Normalize the customer's email before storing it.
            customer: {
              name: customer.name,
              email: customer.email.toLowerCase(),
              phone: customer.phone,
            },

            totalAmount,

            // New bookings begin in pending state until payment
            // is successfully completed.
            paymentStatus: "pending",
            bookingStatus: "pending",

            // Reserve the selected seats for 10 minutes.
            expiresAt: new Date(
              Date.now() + 10 * 60 * 1000
            ),
          },
        ],
        { session }
      );

      // Debug log for verifying that movie/showtime snapshots
      // are correctly created.
      console.log("SNAPSHOT TEST", {
        movieSnapshot: {
          title: movie.title,
          poster: movie.poster || "",
        },
        showtimeSnapshot: {
          date: showtime.date,
          startTime: showtime.startTime,
          ticketPrice: showtime.ticketPrice,
        },
      });

      // Store the newly created booking for the response.
      createdBooking = booking;
    });

    // Return the newly created booking to the client.
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
    // Log unexpected errors for server-side debugging.
    console.error("POST booking error:", error);

    // Handle movie-not-found errors.
    if (error.message === "MOVIE_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Movie not found" },
        { status: 404 }
      );
    }

    // Handle showtime-not-found errors.
    if (error.message === "SHOWTIME_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Showtime not found" },
        { status: 404 }
      );
    }

    // Handle hall-not-found errors.
    if (error.message === "HALL_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Hall not found" },
        { status: 404 }
      );
    }

    // Handle invalid movie/showtime relationships.
    if (error.message === "SHOWTIME_MOVIE_MISMATCH") {
      return NextResponse.json(
        {
          success: false,
          message: "Showtime does not belong to this movie",
        },
        { status: 400 }
      );
    }

    // Handle invalid showtime/hall relationships.
    if (error.message === "SHOWTIME_HALL_MISMATCH") {
      return NextResponse.json(
        {
          success: false,
          message: "Showtime does not belong to this hall",
        },
        { status: 400 }
      );
    }

    // Handle seats that do not exist in the selected hall.
    if (error.message === "INVALID_SEAT") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid seat selected",
        },
        { status: 400 }
      );
    }

    // Handle seats that have already been booked or temporarily reserved.
    if (error.message.startsWith("SEATS_BOOKED:")) {
      const occupiedSeats =
        error.message
          .replace("SEATS_BOOKED:", "")
          .split(",");

      return NextResponse.json(
        {
          success: false,
          message:
            "Some selected seats are already booked",
          occupiedSeats,
        },
        { status: 409 }
      );
    }

    // Return a generic error for unexpected failures.
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking",
      },
      { status: 500 }
    );
  } finally {
    // Always close the MongoDB session, regardless of success or failure.
    await session.endSession();
  }
}

