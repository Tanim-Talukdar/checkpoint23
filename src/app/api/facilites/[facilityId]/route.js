import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import Facility from "@/models/facility";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const allowedSlotDurations = [
  15,
  30,
  60,
  90,
  120,
  180,
];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateTime(value) {
  return typeof value === "string" && timeRegex.test(value);
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function validateSchedule(schedule) {
  if (!schedule) {
    return "Schedule is required";
  }

  if (!validateTime(schedule.startTime)) {
    return "Invalid start time";
  }

  if (!validateTime(schedule.endTime)) {
    return "Invalid end time";
  }

  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);

  if (start >= end) {
    return "End time must be later than start time";
  }

  const slotDuration = Number(
    schedule.slotDurationMinutes
  );

  if (
    !allowedSlotDurations.includes(
      slotDuration
    )
  ) {
    return "Invalid slot duration";
  }

  if (end - start < slotDuration) {
    return "Slot duration is longer than the schedule";
  }

  if (
    schedule.active !== undefined &&
    typeof schedule.active !== "boolean"
  ) {
    return "Invalid active value";
  }

  return null;
}

function validateService(service) {
  if (!service) {
    return "Service is required";
  }

  if (!isValidObjectId(service.id)) {
    return "Invalid service ID";
  }

  if (
    service.price !== undefined &&
    (
      typeof service.price !== "number" ||
      !Number.isFinite(service.price) ||
      service.price < 0
    )
  ) {
    return "Invalid price";
  }

  if (
    service.capacity !== undefined &&
    service.capacity !== null &&
    (
      typeof service.capacity !== "number" ||
      !Number.isInteger(service.capacity) ||
      service.capacity < 1
    )
  ) {
    return "Invalid capacity";
  }

  if (
    service.durationMinutes !== undefined &&
    service.durationMinutes !== null &&
    (
      typeof service.durationMinutes !== "number" ||
      !Number.isInteger(service.durationMinutes) ||
      service.durationMinutes < 1
    )
  ) {
    return "Invalid duration";
  }

  if (
    service.minimumQuantity !== undefined &&
    (
      typeof service.minimumQuantity !== "number" ||
      !Number.isInteger(service.minimumQuantity) ||
      service.minimumQuantity < 1
    )
  ) {
    return "Invalid minimum quantity";
  }

  if (
    service.maximumQuantity !== undefined &&
    service.maximumQuantity !== null &&
    (
      typeof service.maximumQuantity !== "number" ||
      !Number.isInteger(service.maximumQuantity) ||
      service.maximumQuantity < 1
    )
  ) {
    return "Invalid maximum quantity";
  }

  if (
    service.active !== undefined &&
    typeof service.active !== "boolean"
  ) {
    return "Invalid active value";
  }

  if (
    service.exclusive !== undefined &&
    typeof service.exclusive !== "boolean"
  ) {
    return "Invalid exclusive value";
  }

  return null;
}

/*
 * Bangladesh local date handling.
 *
 * The admin UI sends YYYY-MM-DD.
 * We intentionally interpret that as the beginning
 * of the Bangladesh calendar day rather than relying
 * on the browser/server timezone.
 */
function parseBangladeshDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    )
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  /*
   * Bangladesh is UTC+6.
   * Midnight Bangladesh = previous day 18:00 UTC.
   */
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    ) - 6 * 60 * 60 * 1000
  );
}

function sortPriceHistory(history) {
  return [...history].sort(
    (a, b) =>
      new Date(a.effectiveFrom).getTime() -
      new Date(b.effectiveFrom).getTime()
  );
}

function addPriceHistoryEntry(
  service,
  price,
  effectiveFrom
) {
  const history = Array.isArray(
    service.priceHistory
  )
    ? [...service.priceHistory]
    : [];

  const existingIndex = history.findIndex(
    (entry) =>
      new Date(entry.effectiveFrom).getTime() ===
      effectiveFrom.getTime()
  );

  if (existingIndex >= 0) {
    history[existingIndex] = {
      price,
      effectiveFrom,
    };
  } else {
    history.push({
      price,
      effectiveFrom,
    });
  }

  service.priceHistory =
    sortPriceHistory(history);
}

function updateCurrentPriceFromHistory(service) {
  const history = sortPriceHistory(
    service.priceHistory || []
  );

  if (!history.length) {
    return;
  }

  const now = Date.now();

  const applicable = history
    .filter(
      (entry) =>
        new Date(
          entry.effectiveFrom
        ).getTime() <= now
    )
    .at(-1);

  if (applicable) {
    service.price = applicable.price;
  }
}

export async function GET(request, { params }) {
  try {
    const { authenticated } =
      await requireAdmin();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { facilityId } = await params;

    if (!isValidObjectId(facilityId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid facility ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const facility =
      await Facility.findById(
        facilityId
      ).lean();

    if (!facility) {
      return NextResponse.json(
        {
          success: false,
          message: "Facility not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      facility,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/facilities/[facilityId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load facility",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request,
  { params }
) {
  try {
    const { authenticated } =
      await requireAdmin();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { facilityId } = await params;

    if (!isValidObjectId(facilityId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid facility ID",
        },
        { status: 400 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const facility =
      await Facility.findById(
        facilityId
      );

    if (!facility) {
      return NextResponse.json(
        {
          success: false,
          message: "Facility not found",
        },
        { status: 404 }
      );
    }

    /*
     * ------------------------------------------------------------
     * FACILITY ACTIVE STATE
     * ------------------------------------------------------------
     */

    if (body.active !== undefined) {
      if (
        typeof body.active !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid active value",
          },
          { status: 400 }
        );
      }

      facility.active = body.active;
    }

    /*
     * ------------------------------------------------------------
     * SERVICE UPDATE
     * ------------------------------------------------------------
     *
     * Only an existing service may be edited.
     * No service creation/deletion is possible.
     */

    if (body.service !== undefined) {
      const serviceError =
        validateService(body.service);

      if (serviceError) {
        return NextResponse.json(
          {
            success: false,
            message: serviceError,
          },
          { status: 400 }
        );
      }

      const service =
        facility.services.id(
          body.service.id
        );

      if (!service) {
        return NextResponse.json(
          {
            success: false,
            message: "Service not found",
          },
          { status: 404 }
        );
      }

      /*
       * PRICE HISTORY
       */

      if (
        body.service.price !== undefined &&
        body.service.price !== service.price
      ) {
        if (
          !body.service.effectiveDate
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Price changes require an effective date",
            },
            { status: 400 }
          );
        }

        const effectiveDate =
          parseBangladeshDate(
            body.service.effectiveDate
          );

        if (!effectiveDate) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid price effective date",
            },
            { status: 400 }
          );
        }

        addPriceHistoryEntry(
          service,
          body.service.price,
          effectiveDate
        );

        /*
         * If the effective date is today/past,
         * the new price becomes current.
         *
         * If it is future, the current price
         * remains unchanged.
         */
        if (
          effectiveDate.getTime() <=
          Date.now()
        ) {
          service.price =
            body.service.price;
        }
      } else if (
        body.service.effectiveDate &&
        body.service.price !== undefined
      ) {
        /*
         * If the same price is submitted with
         * an effective date, keep the history
         * synchronized without creating duplicates.
         */
        const effectiveDate =
          parseBangladeshDate(
            body.service.effectiveDate
          );

        if (!effectiveDate) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid price effective date",
            },
            { status: 400 }
          );
        }

        addPriceHistoryEntry(
          service,
          body.service.price,
          effectiveDate
        );

        updateCurrentPriceFromHistory(
          service
        );
      }

      /*
       * SERVICE NAME
       */

      if (
        body.service.name !== undefined
      ) {
        if (
          typeof body.service.name !==
            "string" ||
          !body.service.name.trim()
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Invalid service name",
            },
            { status: 400 }
          );
        }

        service.name =
          body.service.name.trim();
      }

      /*
       * SERVICE PRICE
       */

      /*
       * Price is handled above because
       * it requires price history.
       */

      /*
       * CAPACITY
       */

      if (
        body.service.capacity !==
        undefined
      ) {
        service.capacity =
          body.service.capacity;
      }

      /*
       * DURATION
       */

      if (
        body.service.durationMinutes !==
        undefined
      ) {
        service.durationMinutes =
          body.service.durationMinutes;
      }

      /*
       * MINIMUM QUANTITY
       */

      if (
        body.service.minimumQuantity !==
        undefined
      ) {
        service.minimumQuantity =
          body.service.minimumQuantity;
      }

      /*
       * MAXIMUM QUANTITY
       */

      if (
        body.service.maximumQuantity !==
        undefined
      ) {
        service.maximumQuantity =
          body.service.maximumQuantity;
      }

      /*
       * ACTIVE
       */

      if (
        body.service.active !==
        undefined
      ) {
        service.active =
          body.service.active;
      }

      /*
       * EXCLUSIVE
       */

      if (
        body.service.exclusive !==
        undefined
      ) {
        service.exclusive =
          body.service.exclusive;
      }

      /*
       * Ensure min <= max.
       */

      if (
        service.maximumQuantity !==
          null &&
        service.maximumQuantity !==
          undefined &&
        service.minimumQuantity >
          service.maximumQuantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Minimum quantity cannot exceed maximum quantity",
          },
          { status: 400 }
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * RECURRING SCHEDULE UPDATE
     * ------------------------------------------------------------
     *
     * Frontend sends:
     *
     * {
     *   schedules: [
     *     {
     *       id,
     *       dayOfWeek,
     *       startTime,
     *       endTime,
     *       slotDurationMinutes,
     *       active
     *     }
     *   ]
     * }
     *
     * All seven existing schedules are updated.
     * No new schedule records are created.
     */

    if (body.schedules !== undefined) {
      if (
        !Array.isArray(
          body.schedules
        ) ||
        body.schedules.length !== 7
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Exactly seven weekly schedules are required",
          },
          { status: 400 }
        );
      }

      const receivedDays =
        new Set();

      for (
        const incoming of body.schedules
      ) {
        const dayOfWeek = Number(
          incoming.dayOfWeek
        );

        if (
          !Number.isInteger(dayOfWeek) ||
          dayOfWeek < 0 ||
          dayOfWeek > 6
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid day of week",
            },
            { status: 400 }
          );
        }

        if (
          receivedDays.has(dayOfWeek)
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Duplicate day of week",
            },
            { status: 400 }
          );
        }

        receivedDays.add(dayOfWeek);

        const scheduleError =
          validateSchedule(
            incoming
          );

        if (scheduleError) {
          return NextResponse.json(
            {
              success: false,
              message: scheduleError,
            },
            { status: 400 }
          );
        }
      }

      for (
        const incoming of body.schedules
      ) {
        const dayOfWeek = Number(
          incoming.dayOfWeek
        );

        const schedule =
          facility.schedules.find(
            (item) =>
              item.dayOfWeek ===
              dayOfWeek
          );

        if (!schedule) {
          return NextResponse.json(
            {
              success: false,
              message:
                `Schedule not found for day ${dayOfWeek}`,
            },
            { status: 404 }
          );
        }

        schedule.startTime =
          incoming.startTime;

        schedule.endTime =
          incoming.endTime;

        schedule.slotDurationMinutes =
          Number(
            incoming.slotDurationMinutes
          );

        if (
          incoming.active !==
          undefined
        ) {
          schedule.active =
            incoming.active;
        }
      }
    }

    /*
     * ------------------------------------------------------------
     * SAVE
     * ------------------------------------------------------------
     */

    await facility.save();

    return NextResponse.json({
      success: true,
      message:
        "Facility updated successfully",
      facility:
        facility.toObject(),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/facilities/[facilityId] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update facility",
      },
      { status: 500 }
    );
  }
}