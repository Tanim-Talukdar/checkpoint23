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
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid showtime ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const showtime = await Showtime.findById(id)
      .populate(
        "movieId",
        "title poster backdrop duration rating"
      )
      .populate(
        "hallId",
        "name capacity rows seatsPerRow"
      );

    if (!showtime) {
      return NextResponse.json(
        {
          success: false,
          message: "Showtime not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      showtime,
    });
  } catch (error) {
    console.error("GET showtime error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch showtime",
      },
      { status: 500 }
    );
  }
}

// ADMIN ONLY
export async function PUT(request, { params }) {
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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid showtime ID",
        },
        { status: 400 }
      );
    }

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

    const duplicate = await Showtime.findOne({
      _id: { $ne: id },
      movieId,
      hallId: hall._id,
      date,
      startTime,
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "This showtime already exists",
        },
        { status: 409 }
      );
    }

    const showtime = await Showtime.findByIdAndUpdate(
      id,
      {
        movieId,
        hallId: hall._id,
        date,
        startTime,
        ticketPrice,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "movieId",
        "title poster backdrop duration rating"
      )
      .populate(
        "hallId",
        "name capacity rows seatsPerRow"
      );

    if (!showtime) {
      return NextResponse.json(
        {
          success: false,
          message: "Showtime not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Showtime updated successfully",
      showtime,
    });
  } catch (error) {
    console.error("PUT showtime error:", error);

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
        message: "Failed to update showtime",
      },
      { status: 500 }
    );
  }
}

// ADMIN ONLY
export async function DELETE(request, { params }) {
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
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid showtime ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const showtime = await Showtime.findByIdAndDelete(id);

    if (!showtime) {
      return NextResponse.json(
        {
          success: false,
          message: "Showtime not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Showtime deleted successfully",
    });
  } catch (error) {
    console.error("DELETE showtime error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete showtime",
      },
      { status: 500 }
    );
  }
}