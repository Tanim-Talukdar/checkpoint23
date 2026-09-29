import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/admin";
import { requireAdmin } from "@/lib/requireAdmin";

const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function GET() {
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

    if (auth.admin.adminLevel !== "main") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const admins = await Admin.find({})
      .select("_id name email role adminLevel isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    if (auth.admin.adminLevel !== "main") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = createAdminSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    await connectDB();

    const normalizedEmail = email.toLowerCase();

    const existingAdmin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin already exists",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "admin",
      adminLevel: "moderator",
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Admin created successfully",
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          adminLevel: admin.adminLevel,
          isActive: admin.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}