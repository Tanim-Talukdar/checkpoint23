import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Movie from "@/models/movie";
import Hall from "@/models/hall";
import Showtime from "@/models/showtime";
import { requireAdmin } from "@/lib/requireAdmin";

const showtimeSchema = z.object({
  movieId: z.string().refine(
    (value) => mongoose.Types.ObjectId.isValid(value),
    {
      message: "Invalid movie ID",
    }
  ),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be YYYY-MM-DD",
  }),

  startTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: "Time must be HH:mm",
  }),

  ticketPrice: z.number().min(0),
});

// PUBLIC
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const movieId = searchParams.get("movieId");

    const now = new Date();

    // Bangladesh local date/time
    const bangladeshDate = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(now);

    const bangladeshTime = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).format(now);

    const filter = {
      date: {
        $gte: bangladeshDate,
      },
    };

    // If a movieId is provided
    if (movieId) {
      filter.movieId = movieId;
    }

    // For today's showtimes, only allow future times
    filter.$or = [
      {
        date: {
          $gt: bangladeshDate,
        },
      },
      {
        date: bangladeshDate,
        startTime: {
          $gt: bangladeshTime,
        },
      },
    ];

    const showtimes = await Showtime.find(filter)
      .populate(
        "movieId",
        "title poster backdrop duration rating"
      )
      .populate(
        "hallId",
        "name capacity rows seatsPerRow"
      )
      .sort({
        date: 1,
        startTime: 1,
      });

    return NextResponse.json({
      success: true,
      showtimes,
    });
  } catch (error) {
    console.error("GET showtimes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch showtimes",
      },
      { status: 500 }
    );
  }
}

// ADMIN ONLY
export async function POST(request) {
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

  try {
    const body = await request.json();

    const result = showtimeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid showtime data",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      movieId,
      date,
      startTime,
      ticketPrice,
    } = result.data;

    await connectDB();

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: "Movie not found",
        },
        { status: 404 }
      );
    }

    const hall = await Hall.findOne({
      name: "Hall 1",
    });

    if (!hall) {
      return NextResponse.json(
        {
          success: false,
          message: "Hall 1 not found",
        },
        { status: 404 }
      );
    }

    const existingShowtime = await Showtime.findOne({
      movieId,
      hallId: hall._id,
      date,
      startTime,
    });

    if (existingShowtime) {
      return NextResponse.json(
        {
          success: false,
          message: "This showtime already exists",
        },
        { status: 409 }
      );
    }

    const showtime = await Showtime.create({
      movieId,
      hallId: hall._id,
      date,
      startTime,
      ticketPrice,
    });

    await showtime.populate([
      {
        path: "movieId",
        select: "title poster backdrop duration rating",
      },
      {
        path: "hallId",
        select: "name capacity rows seatsPerRow",
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Showtime created successfully",
        showtime,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST showtime error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "This showtime already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create showtime",
      },
      { status: 500 }
    );
  }
}