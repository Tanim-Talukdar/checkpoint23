import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Movie from "@/models/movie";
import { requireAdmin } from "@/lib/requireAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

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
export async function GET() {
  try {
    await connectDB();

    const movies = await Movie.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error("GET movies error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch movies",
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
  const limit = checkRateLimit(request, 10, 10 * 60 * 1000);
  if (!limit.allowed) return limit.response;
  try {
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

    const movie = await Movie.create(result.data);

    return NextResponse.json(
      {
        success: true,
        message: "Movie created successfully",
        movie,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST movie error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create movie",
      },
      { status: 500 }
    );
  }
}