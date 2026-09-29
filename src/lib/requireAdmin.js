import { cookies } from "next/headers";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/admin";
import { verifyAdminToken } from "@/lib/adminAuth";

export async function requireAdmin() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("admin_session")?.value;

    if (!token) {
      return {
        authenticated: false,
        admin: null,
      };
    }

    const payload = verifyAdminToken(token);

    if (
      !payload ||
      !payload.adminId ||
      payload.role !== "admin"
    ) {
      return {
        authenticated: false,
        admin: null,
      };
    }

    await connectDB();

    const admin = await Admin.findOne({
      _id: payload.adminId,
      role: "admin",
      isActive: true,
    }).select(
      "_id name email role adminLevel isActive"
    );

    if (!admin) {
      return {
        authenticated: false,
        admin: null,
      };
    }

    return {
      authenticated: true,
      admin,
    };
  } catch (error) {
    // Log internally only
    console.error("Admin authentication failed");

    // Never expose internal error details
    return {
      authenticated: false,
      admin: null,
    };
  }
}