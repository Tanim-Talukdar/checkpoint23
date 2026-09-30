import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/admin";
import { createAdminToken } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/rateLimit";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request) {
  try {
    const limit = checkRateLimit(request, 5, 15 * 60 * 1000);

    if (!limit.allowed) return limit.response;

    const validation = loginSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    await connectDB();

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    }).select("_id name email role passwordHash isActive");

    if (!admin?.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const token = createAdminToken(admin);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}