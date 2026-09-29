import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/admin";
import { requireAdmin } from "@/lib/requireAdmin";

const updateSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(request, { params }) {
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin ID",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(id);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin not found",
        },
        { status: 404 }
      );
    }

    // Main admin cannot be disabled
    if (
      admin.adminLevel === "main" &&
      admin._id.toString() === auth.admin._id.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot disable the main admin",
        },
        { status: 400 }
      );
    }

    admin.isActive = result.data.isActive;

    await admin.save();

    return NextResponse.json({
      success: true,
      message: admin.isActive
        ? "Admin enabled"
        : "Admin disabled",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminLevel: admin.adminLevel,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}