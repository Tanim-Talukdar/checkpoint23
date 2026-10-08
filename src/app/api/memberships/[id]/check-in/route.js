
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Membership from "@/models/membership";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  getDhakaTodayStart,
  getDhakaTodayString,
  getMembershipStatus,
} from "@/lib/membershipDate";

export const runtime = "nodejs";

export async function POST(request, { params }) {
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid membership ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const now = new Date();

    /*
     * Bangladesh calendar date.
     *
     * Example:
     * 2026-10-09
     */
    const today = getDhakaTodayString(now);

    /*
     * Start of today's Bangladesh calendar day.
     *
     * This is used only where a real Date boundary
     * is required.
     */
    const todayStart = getDhakaTodayStart(now);

    /*
     * Read the membership first so we can return
     * useful and accurate errors.
     */
    const membership =
      await Membership.findById(id).lean();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "Membership not found",
        },
        { status: 404 }
      );
    }

    /*
     * Always use the shared membership status helper.
     */
    const status =
      getMembershipStatus(
        membership,
        now
      );

    if (status === "upcoming") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This membership has not started yet.",
        },
        { status: 400 }
      );
    }

    if (status === "expired") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This membership has expired. Renew it before checking in.",
        },
        { status: 400 }
      );
    }

    /*
     * Check today's entry using the stored calendar
     * date field.
     *
     * This intentionally does NOT depend on the UTC
     * representation of checkedInAt.
     */
    const alreadyCheckedIn =
      Array.isArray(
        membership.dailyEntries
      ) &&
      membership.dailyEntries.some(
        (entry) =>
          String(entry?.date || "") === today
      );

    if (alreadyCheckedIn) {
      const existingEntry =
        membership.dailyEntries.find(
          (entry) =>
            String(entry?.date || "") ===
            today
        );

      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_CHECKED_IN",
          message:
            "This member has already checked in today.",
          membership: {
            id: membership._id.toString(),
            code: membership.membershipCode,
            todayEntryTime:
              existingEntry?.checkedInAt ||
              null,
            totalEntries:
              membership.dailyEntries.length,
          },
        },
        { status: 409 }
      );
    }

    /*
     * IMPORTANT FIX
     *
     * The previous query used:
     *
     *   startDate: { $lte: now }
     *   expiryDate: { $gte: todayStart }
     *
     * That compares raw Date timestamps.
     *
     * Membership validity, however, is based on the
     * Bangladesh CALENDAR DATE.
     *
     * We already established above that this membership
     * is active using getMembershipStatus().
     *
     * Therefore the atomic update only needs to guarantee:
     *
     *   1. membership is still active
     *   2. today's date has not already been inserted
     *
     * This avoids the UTC/Dhaka boundary conflict while
     * retaining atomic race-condition protection.
     */
    const updatedMembership =
      await Membership.findOneAndUpdate(
        {
          _id: id,

          active: true,

          /*
           * Critical atomic condition:
           *
           * No entry with today's Bangladesh
           * calendar date may already exist.
           */
          dailyEntries: {
            $not: {
              $elemMatch: {
                date: today,
              },
            },
          },
        },
        {
          $push: {
            dailyEntries: {
              date: today,
              checkedInAt: now,
            },
          },
        },
        {
          new: true,
        }
      ).lean();

    /*
     * If the atomic update failed, determine the
     * actual reason.
     */
    if (!updatedMembership) {
      const latest =
        await Membership.findById(id).lean();

      if (!latest) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Membership not found",
          },
          { status: 404 }
        );
      }

      /*
       * Re-check membership status.
       */
      const latestStatus =
        getMembershipStatus(
          latest,
          new Date()
        );

      if (
        latestStatus ===
        "expired"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This membership has expired. Renew it before checking in.",
          },
          { status: 400 }
        );
      }

      if (
        latestStatus ===
        "upcoming"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This membership has not started yet.",
          },
          { status: 400 }
        );
      }

      /*
       * Check whether another request won
       * the atomic race and already checked
       * the member in today.
       */
      const latestAlreadyCheckedIn =
        Array.isArray(
          latest.dailyEntries
        ) &&
        latest.dailyEntries.some(
          (entry) =>
            String(
              entry?.date || ""
            ) === today
        );

      if (
        latestAlreadyCheckedIn
      ) {
        const existingEntry =
          latest.dailyEntries.find(
            (entry) =>
              String(
                entry?.date || ""
              ) === today
          );

        return NextResponse.json(
          {
            success: false,
            code:
              "ALREADY_CHECKED_IN",
            message:
              "This member has already checked in today.",
            membership: {
              id: latest._id.toString(),
              code:
                latest.membershipCode,
              todayEntryTime:
                existingEntry?.checkedInAt ||
                null,
              totalEntries:
                Array.isArray(
                  latest.dailyEntries
                )
                  ? latest.dailyEntries
                      .length
                  : 0,
            },
          },
          { status: 409 }
        );
      }

      /*
       * If active is false, return a clear
       * error rather than a generic conflict.
       */
      if (!latest.active) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This membership is inactive and cannot be checked in.",
          },
          { status: 400 }
        );
      }

      /*
       * Unexpected database conflict.
       */
      console.error(
        "Membership check-in atomic update failed:",
        {
          membershipId: id,
          membershipCode:
            latest.membershipCode,
          today,
          active:
            latest.active,
          startDate:
            latest.startDate,
          expiryDate:
            latest.expiryDate,
          dailyEntries:
            Array.isArray(
              latest.dailyEntries
            )
              ? latest.dailyEntries.length
              : 0,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Check-in could not be completed. Please try again.",
        },
        { status: 409 }
      );
    }

    /*
     * Successful check-in.
     */
    return NextResponse.json({
      success: true,

      message:
        "Member checked in successfully.",

      membership: {
        id:
          updatedMembership._id.toString(),

        code:
          updatedMembership.membershipCode,

        status:
          getMembershipStatus(
            updatedMembership,
            now
          ),

        /*
         * Boolean value required by
         * the admin membership frontend.
         */
        todayEntry: true,

        todayEntryTime: now,

        totalEntries:
          Array.isArray(
            updatedMembership.dailyEntries
          )
            ? updatedMembership
                .dailyEntries.length
            : 0,

        lastEntry:
          updatedMembership
            .dailyEntries?.[
            updatedMembership
              .dailyEntries.length - 1
          ]?.checkedInAt || now,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/memberships/[id]/check-in failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to check in member",
      },
      {
        status: 500,
      }
    );
  }
}

