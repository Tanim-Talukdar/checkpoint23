import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import Showtime from "@/models/showtime";

import { connectDB } from "@/lib/mongodb";
import Movie from "@/models/movie";
import { requireAdmin } from "@/lib/requireAdmin";

const movieSchema = z.object({
  title: z.string().min(1),
  poster: z.string().optional().default(""),
  backdrop: z.string().optional().default(""),
  description: z.string().optional().default(""),
  genres: z.array(z.string()).optional().default([]),
  rating: z.number().min(0).max(10).optional().default(0),
  duration: z.number().min(0).optional().default(0),
  releaseDate: z.string().optional().default(""),
  trailer: z.string().optional().default(""),
  director: z.string().optional().default(""),
  cast: z.array(z.string()).optional().default([]),
});

// PUBLIC
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const movie = await Movie.findById(id);

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: "Movie not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error("GET movie error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch movie",
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
          message: "Invalid movie ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = movieSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie data",
          errors: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const movie = await Movie.findByIdAndUpdate(
      id,
      result.data,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!movie) {
      return NextResponse.json(
        {
          success: false,
          message: "Movie not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error("PUT movie error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update movie",
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
          message: "Invalid movie ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const movie = await Movie.findByIdAndDelete(id);

if (!movie) {
  return NextResponse.json(
    {
      success: false,
      message: "Movie not found",
    },
    { status: 404 }
  );
}

await Showtime.deleteMany({
  movieId: id,
});

return NextResponse.json({
  success: true,
  message: "Movie and related showtimes deleted successfully",
});
  } catch (error) {
    console.error("DELETE movie error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete movie",
      },
      { status: 500 }
    );
  }
}