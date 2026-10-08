
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Membership from "@/models/membership";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  addDhakaCalendarDays,
  addDhakaCalendarMonths,
  getDhakaTodayStart,
  getMembershipStatus,
} from "@/lib/membershipDate";

export const runtime = "nodejs";

const MEMBERSHIP_PRICES = {
  gym: 4000,
  pool: 4000,
  gym_pool: 6000,
};

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
     * Start of today's Bangladesh calendar day.
     *
     * Renewal starts today according to the Dhaka
     * calendar, not according to the UTC timestamp.
     */
    const todayStart =
      getDhakaTodayStart(now);

    /*
     * Read the membership first.
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
     * Determine status using the shared membership
     * date logic.
     */
    const status =
      getMembershipStatus(
        membership,
        now
      );

    /*
     * Only expired memberships can be renewed.
     */
    if (status !== "expired") {
      return NextResponse.json(
        {
          success: false,
          message:
            status === "active"
              ? "This membership is still active and cannot be renewed yet."
              : "This membership has not started yet.",
        },
        { status: 400 }
      );
    }

    /*
     * Never trust the client for the renewal price.
     *
     * Price is determined from the membership type
     * stored in MongoDB.
     */
    const price =
      MEMBERSHIP_PRICES[
        membership.membershipType
      ];

    if (typeof price !== "number") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to determine the membership renewal price.",
        },
        { status: 400 }
      );
    }

    /*
     * Renewal starts today in Bangladesh.
     *
     * Example:
     *
     * 08 Oct -> 07 Nov
     *
     * This gives one full calendar month of
     * membership access.
     */
    const newStartDate = todayStart;

    const nextMonthDate =
      addDhakaCalendarMonths(
        newStartDate,
        1
      );

    const newExpiryDate =
      addDhakaCalendarDays(
        nextMonthDate,
        -1
      );

    /*
     * We do not trust the browser for:
     *
     * - price
     * - start date
     * - expiry date
     * - payment status
     * - admin identity
     *
     * Everything important is calculated here.
     */
    const adminId =
      auth.admin?._id
        ? auth.admin._id.toString()
        : "";

    /*
     * IMPORTANT:
     *
     * The previous atomic condition used:
     *
     *   expiryDate: {
     *     $lt: todayStart
     *   }
     *
     * That means an expiry date that falls on
     * today's Bangladesh calendar date might not
     * match the renewal operation.
     *
     * We instead use the membership's date validity
     * boundaries in a way that matches the shared
     * membership status calculation.
     *
     * Since getMembershipStatus() has already established
     * that the membership is expired, the atomic update
     * needs to prevent a second simultaneous renewal.
     *
     * The safest condition is:
     *
     *   active: true
     *   expiryDate exists
     *
     * followed by re-checking the resulting document.
     *
     * The update itself is atomic, so only one request
     * can transition this particular membership from
     * the expired state into the new active state.
     */
    const updatedMembership =
      await Membership.findOneAndUpdate(
        {
          _id: id,

          /*
           * An expired membership that has not already
           * been renewed should still be active in the
           * stored model.
           *
           * Once renewed, active becomes true and the
           * expiryDate moves into the future.
           *
           * We therefore additionally require the stored
           * expiry date to be earlier than today's calendar
           * boundary OR to be exactly today's calendar date.
           */
          active: true,

          expiryDate: {
            $lte: new Date(
              todayStart.getTime() +
                24 * 60 * 60 * 1000 -
                1
            ),
          },
        },
        {
          $set: {
            startDate: newStartDate,

            expiryDate: newExpiryDate,

            active: true,

            lastRenewedAt: now,
          },

          $inc: {
            renewalCount: 1,
          },

          $push: {
            renewalHistory: {
              renewedAt: now,

              previousStartDate:
                membership.startDate,

              previousExpiryDate:
                membership.expiryDate,

              newStartDate,

              newExpiryDate,

              price,

              /*
               * SSLCOMMERZ payment is not connected
               * to membership renewal yet.
               *
               * Therefore pending is truthful.
               */
              paymentStatus: "pending",

              paymentTransactionId: "",

              adminId,
            },
          },
        },
        {
          new: true,
        }
      ).lean();

    /*
     * Atomic update did not match.
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

      const latestStatus =
        getMembershipStatus(
          latest,
          new Date()
        );

      /*
       * If the membership is no longer expired,
       * another request most likely renewed it first.
       */
      if (latestStatus !== "expired") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This membership was already renewed or is no longer expired.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Renewal could not be completed. Please try again.",
        },
        { status: 409 }
      );
    }

    /*
     * Get the renewal record just created.
     */
    const latestRenewal =
      updatedMembership
        .renewalHistory[
          updatedMembership
            .renewalHistory.length - 1
        ];

    /*
     * Return the updated membership.
     */
    return NextResponse.json({
      success: true,

      message:
        "Membership renewed successfully.",

      membership: {
        id:
          updatedMembership._id.toString(),

        code:
          updatedMembership.membershipCode,

        customer:
          updatedMembership.customerName,

        type:
          updatedMembership.membershipType,

        price:
          updatedMembership.price,

        renewalPrice:
          price,

        startDate:
          updatedMembership.startDate,

        expiryDate:
          updatedMembership.expiryDate,

        active:
          updatedMembership.active,

        status:
          getMembershipStatus(
            updatedMembership,
            new Date()
          ),

        renewalCount:
          updatedMembership.renewalCount,

        lastRenewedAt:
          updatedMembership.lastRenewedAt,

        paymentStatus:
          latestRenewal?.paymentStatus ||
          "pending",
      },
    });
  } catch (error) {
    console.error(
      "POST /api/memberships/[id]/renew failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to renew membership",
      },
      {
        status: 500,
      }
    );
  }
}
