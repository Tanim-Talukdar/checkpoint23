import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import { requireAdmin } from "@/lib/requireAdmin";

import Membership from "@/models/membership";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Asia/Dhaka";

/**
 * Get a YYYY-MM-DD calendar date in Bangladesh.
 */
function getDhakaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Convert a membership date into its Bangladesh calendar date.
 *
 * Membership start/expiry dates are stored as Date objects.
 * We intentionally compare their calendar dates in Asia/Dhaka
 * rather than comparing raw UTC timestamps.
 */
function getMembershipDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return getDhakaDateKey(date);
}

/**
 * Add one calendar day to YYYY-MM-DD.
 */
function addOneDay(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day + 1
    )
  );

  return date.toISOString().slice(0, 10);
}

/**
 * Get today's Bangladesh calendar date.
 */
function getTodayDateKey() {
  return getDhakaDateKey(new Date());
}

/**
 * Get tomorrow's Bangladesh calendar date.
 */
function getTomorrowDateKey() {
  return addOneDay(getTodayDateKey());
}

/**
 * Determine membership status using the Bangladesh calendar.
 *
 * IMPORTANT:
 * The API returns lowercase status values because the admin
 * frontend expects:
 *
 *   active
 *   upcoming
 *   expired
 *
 * Rules:
 * - inactive membership => expired
 * - before start date => upcoming
 * - on/after expiry date => expired
 * - otherwise => active
 *
 * Example:
 * startDate  = 2026-10-09
 * expiryDate = 2026-11-09
 *
 * Oct 9 through Nov 8 => active
 * Nov 9 onward       => expired
 */
function getMembershipStatus(membership) {
  if (!membership?.active) {
    return "expired";
  }

  const todayKey = getTodayDateKey();

  const startDateKey = getMembershipDateKey(
    membership.startDate
  );

  const expiryDateKey = getMembershipDateKey(
    membership.expiryDate
  );

  if (!startDateKey || !expiryDateKey) {
    return "expired";
  }

  if (todayKey < startDateKey) {
    return "upcoming";
  }

  if (todayKey >= expiryDateKey) {
    return "expired";
  }

  return "active";
}

/**
 * Determine whether an entry belongs to today in Bangladesh.
 *
 * We primarily use checkedInAt because it is the actual
 * check-in timestamp.
 *
 * The stored `date` field is also supported as a fallback
 * when checkedInAt is unavailable/invalid.
 */
function isTodayEntry(entry) {
  if (!entry) {
    return false;
  }

  const todayKey = getTodayDateKey();

  if (entry.checkedInAt) {
    const checkedInAt = new Date(entry.checkedInAt);

    if (!Number.isNaN(checkedInAt.getTime())) {
      return (
        getDhakaDateKey(checkedInAt) === todayKey
      );
    }
  }

  if (entry.date) {
    const storedDate = String(entry.date).slice(0, 10);

    return storedDate === todayKey;
  }

  return false;
}

/**
 * Serialize a membership for the admin frontend.
 *
 * IMPORTANT:
 * The frontend expects:
 *
 * status:
 *   "active"
 *   "upcoming"
 *   "expired"
 *
 * todayEntry:
 *   true  = used today
 *   false = not used today
 *
 * Do NOT return "Active", "Expired", "Used", or "Not Used"
 * from this API because the frontend maps those values itself.
 */
function serializeMembership(membership) {
  const status = getMembershipStatus(membership);

  const dailyEntries = Array.isArray(
    membership.dailyEntries
  )
    ? membership.dailyEntries
    : [];

  const todayEntry = dailyEntries.find(
    (entry) => isTodayEntry(entry)
  );

  const sortedEntries = [...dailyEntries].sort(
    (a, b) => {
      const aTime = a?.checkedInAt
        ? new Date(a.checkedInAt).getTime()
        : 0;

      const bTime = b?.checkedInAt
        ? new Date(b.checkedInAt).getTime()
        : 0;

      return bTime - aTime;
    }
  );

  const lastEntry = sortedEntries[0] || null;

  return {
    id: membership._id.toString(),

    code: membership.membershipCode,

    customer: membership.customerName,

    email: membership.customerEmail,

    phone: membership.customerPhone,

    type: membership.membershipType,

    facilities: membership.facilities,

    price: membership.price,

    startDate: membership.startDate,

    expiryDate: membership.expiryDate,

    active: membership.active,

    /*
     * IMPORTANT:
     * Lowercase values are required by the frontend.
     */
    status,

    /**
     * Membership currently has no top-level paymentStatus
     * in the schema.
     *
     * Keep the existing frontend contract and default
     * activated memberships to Paid.
     */
    paymentStatus:
      membership.paymentStatus || "paid",

    /**
     * IMPORTANT:
     * This MUST be a boolean.
     *
     * true  = an actual check-in exists today
     * false = no check-in exists today
     *
     * The frontend converts this to:
     * "Used" / "Not Used"
     */
    todayEntry: Boolean(todayEntry),

    todayEntryTime:
      todayEntry?.checkedInAt || null,

    totalEntries: dailyEntries.length,

    lastEntry: lastEntry
      ? {
          date: lastEntry.date,
          checkedInAt: lastEntry.checkedInAt,
        }
      : null,

    lastRenewedAt:
      membership.lastRenewedAt,

    renewalCount:
      membership.renewalCount || 0,

    notes:
      membership.notes || "",

    renewalHistory:
      membership.renewalHistory || [],

    createdAt:
      membership.createdAt,

    updatedAt:
      membership.updatedAt,
  };
}

export async function GET(request) {
  try {
    await requireAdmin();

    await connectDB();

    const { searchParams } = new URL(
      request.url
    );

    const pageParam = Number(
      searchParams.get("page")
    );

    const limitParam = Number(
      searchParams.get("limit")
    );

    const page =
      Number.isFinite(pageParam) &&
      pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    const limit =
      Number.isFinite(limitParam) &&
      limitParam > 0
        ? Math.min(
            Math.floor(limitParam),
            100
          )
        : 50;

    const search = (
      searchParams.get("search") || ""
    ).trim();

    const type = (
      searchParams.get("type") || ""
    ).trim();

    const statusParam = (
      searchParams.get("status") || ""
    ).trim();

    const paymentStatusParam = (
      searchParams.get("paymentStatus") || ""
    ).trim();

    /*
     * Normalize frontend filter values.
     *
     * Supports both:
     * Active / active
     * Upcoming / upcoming
     * Expired / expired
     * Pending / pending
     */
    const normalizedStatus =
      statusParam.toLowerCase();

    const normalizedPaymentStatus =
      paymentStatusParam.toLowerCase();

    const query = {};

    /**
     * Search
     */
    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(
        safeSearch,
        "i"
      );

      query.$or = [
        {
          customerName: regex,
        },
        {
          customerEmail: regex,
        },
        {
          customerPhone: regex,
        },
        {
          membershipCode: regex,
        },
      ];
    }

    /**
     * Membership type filter
     */
    if (type) {
      const typeMap = {
        Gym: "gym",
        "Swimming Pool": "pool",
        "Gym + Pool": "gym_pool",

        gym: "gym",
        pool: "pool",
        gym_pool: "gym_pool",
      };

      if (typeMap[type]) {
        query.membershipType =
          typeMap[type];
      }
    }

    /**
     * Get total matching records.
     */
    const total =
      await Membership.countDocuments(
        query
      );

    let memberships;

    /**
     * Status filtering is performed after
     * retrieving matching memberships because
     * status is dynamically calculated from:
     *
     * - active
     * - startDate
     * - expiryDate
     * - Bangladesh calendar date
     */
    const validStatusFilters = [
      "active",
      "upcoming",
      "expired",
      "pending",
    ];

    if (
      validStatusFilters.includes(
        normalizedStatus
      )
    ) {
      const all =
        await Membership.find(query)
          .sort({
            createdAt: -1,
          })
          .lean();

      const filtered = all.filter(
        (membership) => {
          if (
            normalizedStatus ===
            "pending"
          ) {
            return (
              membership.paymentStatus ===
              "pending"
            );
          }

          return (
            getMembershipStatus(
              membership
            ) === normalizedStatus
          );
        }
      );

      const start =
        (page - 1) * limit;

      memberships = filtered.slice(
        start,
        start + limit
      );
    } else {
      memberships =
        await Membership.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) * limit
          )
          .limit(limit)
          .lean();
    }

    /**
     * Payment status filter.
     *
     * Kept compatible with the existing API.
     *
     * The current Membership schema does not
     * contain a top-level paymentStatus field,
     * so activated memberships default to paid
     * only during serialization.
     */
    if (
      [
        "paid",
        "pending",
        "failed",
      ].includes(
        normalizedPaymentStatus
      )
    ) {
      memberships =
        memberships.filter(
          (membership) =>
            (
              membership.paymentStatus ||
              "paid"
            ) ===
            normalizedPaymentStatus
        );
    }

    /**
     * Summary is calculated from all records
     * matching search/type filters.
     */
    const summaryRecords =
      await Membership.find(query)
        .select(
          "active startDate expiryDate price paymentStatus"
        )
        .lean();

    let totalCount = total;

    if (
      [
        "pending",
        "active",
        "upcoming",
        "expired",
      ].includes(normalizedStatus)
    ) {
      totalCount =
        summaryRecords.filter(
          (membership) => {
            if (
              normalizedStatus ===
              "pending"
            ) {
              return (
                membership.paymentStatus ===
                "pending"
              );
            }

            return (
              getMembershipStatus(
                membership
              ) === normalizedStatus
            );
          }
        ).length;
    }

    /**
     * Summary counts
     */
    const activeCount =
      summaryRecords.filter(
        (membership) =>
          getMembershipStatus(
            membership
          ) === "active"
      ).length;

    const upcomingCount =
      summaryRecords.filter(
        (membership) =>
          getMembershipStatus(
            membership
          ) === "upcoming"
      ).length;

    const expiredCount =
      summaryRecords.filter(
        (membership) =>
          getMembershipStatus(
            membership
          ) === "expired"
      ).length;

    /**
     * Membership schema currently doesn't have
     * a top-level paymentStatus field.
     *
     * Keep this calculation compatible with
     * future records that may contain it.
     */
    const paidValue =
      summaryRecords
        .filter(
          (membership) =>
            (
              membership.paymentStatus ||
              "paid"
            ) === "paid" &&
            getMembershipStatus(
              membership
            ) !== "expired"
        )
        .reduce(
          (
            totalValue,
            membership
          ) =>
            totalValue +
            Number(
              membership.price || 0
            ),
          0
        );

    return NextResponse.json(
      {
        success: true,

        memberships:
          memberships.map(
            serializeMembership
          ),

        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages:
            Math.ceil(
              totalCount / limit
            ),
        },

        summary: {
          total:
            summaryRecords.length,

          active:
            activeCount,

          upcoming:
            upcomingCount,

          expired:
            expiredCount,

          paidValue,
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/memberships error:",
      error
    );

    if (error?.status === 401) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
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
          "Failed to load memberships.",
      },
      {
        status: 500,
      }
    );
  }
}