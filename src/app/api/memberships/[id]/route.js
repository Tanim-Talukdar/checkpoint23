import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import Membership from "@/models/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMembershipStatus(
  membership
) {
  const now =
    new Date();

  const startDate =
    new Date(
      membership.startDate
    );

  const expiryDate =
    new Date(
      membership.expiryDate
    );

  if (
    !membership.active ||
    now >= expiryDate
  ) {
    return "Expired";
  }

  if (
    now < startDate
  ) {
    return "Upcoming";
  }

  return "Active";
}

export async function GET(
  request,
  { params }
) {
  try {
    await requireAdmin();

    await connectDB();

    const { id } =
      await params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Invalid membership ID.",
        },
        {
          status: 400,
        }
      );
    }

    const membership =
      await Membership.findById(
        id
      ).lean();

    if (!membership) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Membership not found.",
        },
        {
          status: 404,
        }
      );
    }

    const dailyEntries =
      Array.isArray(
        membership.dailyEntries
      )
        ? [
            ...membership.dailyEntries,
          ]
        : [];

    dailyEntries.sort(
      (a, b) =>
        new Date(
          b.checkedInAt
        ).getTime() -
        new Date(
          a.checkedInAt
        ).getTime()
    );

    const renewalHistory =
      Array.isArray(
        membership.renewalHistory
      )
        ? [
            ...membership.renewalHistory,
          ]
        : [];

    renewalHistory.sort(
      (a, b) =>
        new Date(
          b.renewedAt
        ).getTime() -
        new Date(
          a.renewedAt
        ).getTime()
    );

    return NextResponse.json({
      success: true,

      membership: {
        id:
          membership._id.toString(),

        code:
          membership.membershipCode,

        customer:
          membership.customerName,

        email:
          membership.customerEmail,

        phone:
          membership.customerPhone,

        type:
          membership.membershipType,

        facilities:
          membership.facilities,

        price:
          membership.price,

        startDate:
          membership.startDate,

        expiryDate:
          membership.expiryDate,

        active:
          membership.active,

        status:
          getMembershipStatus(
            membership
          ),

        totalEntries:
          dailyEntries.length,

        dailyEntries,

        lastEntry:
          dailyEntries[0] ||
          null,

        renewalCount:
          membership.renewalCount ||
          0,

        lastRenewedAt:
          membership.lastRenewedAt,

        renewalHistory,

        notes:
          membership.notes ||
          "",

        createdAt:
          membership.createdAt,

        updatedAt:
          membership.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/memberships/[id] error:",
      error
    );

    if (
      error?.status ===
      401
    ) {
      return NextResponse.json(
        {
          success:
            false,
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load membership.",
      },
      {
        status: 500,
      }
    );
  }
}