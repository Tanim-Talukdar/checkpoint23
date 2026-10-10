import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";

import Facility from "@/models/facility";

import Booking from "@/models/booking";

import BookingLock from "@/models/bookingLock";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const OPEN_TIME = 11 * 60;

const CLOSE_TIME = 23 * 60;

// Payment/booking expiry is 10 minutes.
const BOOKING_EXPIRY_MINUTES = 10;

const MAX_ITEMS = 20;

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

const TIME_SLICE_MINUTES = 30;

// Playground off-peak discount configuration.
const PLAYGROUND_OFF_PEAK_DISCOUNT_PERCENTAGE = 30;

const PLAYGROUND_OFF_PEAK_START_TIME = 11 * 60;

const PLAYGROUND_OFF_PEAK_END_TIME = 16 * 60;

const FIXED_MOVIE_SESSIONS = [
  {
    startTime: "11:00",
    endTime: "14:00",
  },
  {
    startTime: "14:00",
    endTime: "17:00",
  },
  {
    startTime: "17:00",
    endTime: "20:00",
  },
  {
    startTime: "20:00",
    endTime: "23:00",
  },
];

const PLAYGROUND_SLUG = "playground";

const PLAYGROUND_ACTIVITY_SLUGS = new Set([
  "futsal",
  "basketball",
  "badminton",
  "pickleball",
]);

const FITNESS_DAY_PASS_TYPES = new Set([
  "day_pass",
]);

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

function jsonSuccess(data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(value);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeString(value).replace(/\s+/g, " ");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+\-() ]{7,25}$/.test(phone);
}

function isValidDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value) {
  if (!isValidTime(value)) return null;

  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const safeMinutes = Math.max(
    0,
    Math.min(1439, minutes)
  );

  const hours = Math.floor(safeMinutes / 60);

  const mins = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins
  ).padStart(2, "0")}`;
}

function addMinutes(time, minutes) {
  const base = timeToMinutes(time);

  if (base === null) return null;

  return minutesToTime(base + minutes);
}

function isTimeAligned(
  time,
  interval = TIME_SLICE_MINUTES
) {
  const minutes = timeToMinutes(time);

  if (minutes === null) return false;

  return minutes % interval === 0;
}

function getDhakaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
  };
}

function dateOnlyToUtc(dateString) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  );
}

function getDayOfWeek(dateString) {
  return dateOnlyToUtc(dateString).getUTCDay();
}

function isDateInPast(dateString) {
  const requested = dateOnlyToUtc(dateString);

  const todayParts = getDhakaDateParts();

  const today = new Date(
    Date.UTC(
      todayParts.year,
      todayParts.month - 1,
      todayParts.day
    )
  );

  return requested < today;
}

function getDateStartUtc(dateString) {
  return dateOnlyToUtc(dateString);
}

function getDateEndUtc(dateString) {
  const start = dateOnlyToUtc(dateString);

  return new Date(
    start.getTime() + 24 * 60 * 60 * 1000
  );
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity)) return null;

  return quantity;
}

function normalizeItem(item, index) {
  if (!item || typeof item !== "object") {
    return {
      error: `Invalid booking item at position ${
        index + 1
      }.`,
    };
  }

  const facilityId = normalizeString(
    item.facilityId
  );

  const serviceId = normalizeString(
    item.serviceId
  );

  const date = normalizeString(item.date);

  /*
   * The frontend may send these values,
   * but the server will NEVER trust them for pricing
   * or duration.
   */

  const startTime = normalizeString(
    item.startTime || item.slot
  );

  const endTime = normalizeString(
    item.endTime
  );

  const movieName = normalizeString(
    item.movieName || item.movie
  );

  const quantity = normalizeQuantity(
    item.quantity
  );

  if (!isValidObjectId(facilityId)) {
    return {
      error: `Invalid facility ID at item ${
        index + 1
      }.`,
    };
  }

  if (!isValidObjectId(serviceId)) {
    return {
      error: `Invalid service ID at item ${
        index + 1
      }.`,
    };
  }

  if (!isValidDateString(date)) {
    return {
      error: `Invalid booking date at item ${
        index + 1
      }.`,
    };
  }

  if (!isValidTime(startTime)) {
    return {
      error: `Invalid start time at item ${
        index + 1
      }.`,
    };
  }

  if (quantity === null || quantity < 1) {
    return {
      error: `Invalid quantity at item ${
        index + 1
      }.`,
    };
  }

  if (endTime && !isValidTime(endTime)) {
    return {
      error: `Invalid end time at item ${
        index + 1
      }.`,
    };
  }

  return {
    facilityId,
    serviceId,
    date,
    startTime,
    endTime,
    quantity,
    movieName,
  };
}

function getScheduleForBooking(
  facility,
  dayOfWeek,
  startTime,
  endTime,
  durationMinutes
) {
  const schedules = Array.isArray(
    facility.schedules
  )
    ? facility.schedules
    : [];

  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (
    startMinutes === null ||
    endMinutes === null
  ) {
    return null;
  }

  return (
    schedules.find((schedule) => {
      if (!schedule.active) return false;

      if (
        Number(schedule.dayOfWeek) !==
        dayOfWeek
      ) {
        return false;
      }

      const scheduleStart =
        timeToMinutes(schedule.startTime);

      const scheduleEnd =
        timeToMinutes(schedule.endTime);

      if (
        scheduleStart === null ||
        scheduleEnd === null
      ) {
        return false;
      }

      if (
        startMinutes < scheduleStart ||
        endMinutes > scheduleEnd
      ) {
        return false;
      }

      const slotDuration = Number(
        schedule.slotDurationMinutes
      );

      if (
        !Number.isFinite(slotDuration) ||
        slotDuration < 1
      ) {
        return false;
      }

      const offset =
        startMinutes - scheduleStart;

      if (offset % slotDuration !== 0) {
        return false;
      }

      if (
        endMinutes - startMinutes !==
        durationMinutes
      ) {
        return false;
      }

      return true;
    }) || null
  );
}

function isMovieService(service) {
  return (
    service.type === "private_movie" ||
    service.pricingType === "per_ticket"
  );
}

function isMembershipService(service) {
  return (
    service.type === "membership" ||
    service.pricingType === "monthly"
  );
}

function isPlaygroundFacility(facility) {
  return (
    facility.slug === PLAYGROUND_SLUG ||
    facility.facilityType === "playground"
  );
}

function isPlaygroundActivity(service) {
  return PLAYGROUND_ACTIVITY_SLUGS.has(
    service.slug
  );
}

/*
 * Server-authoritative Playground off-peak pricing.
 *
 * Discount applies only to Playground activities starting
 * at or after 11:00 and strictly before 16:00.
 *
 * The regular price always comes from MongoDB.
 * The client cannot choose the discount or final price.
 */
function calculateBookingPrice({
  facility,
  service,
  startTime,
}) {
  const regularPrice = Number(service.price);

  if (
    !Number.isFinite(regularPrice) ||
    regularPrice < 0
  ) {
    return {
      error: `Invalid price configured for ${service.name}.`,
    };
  }

  const startMinutes = timeToMinutes(startTime);

  const eligibleForOffPeakDiscount =
    isPlaygroundFacility(facility) &&
    isPlaygroundActivity(service) &&
    startMinutes !== null &&
    startMinutes >= PLAYGROUND_OFF_PEAK_START_TIME &&
    startMinutes < PLAYGROUND_OFF_PEAK_END_TIME;

  if (!eligibleForOffPeakDiscount) {
    return {
      regularPrice,
      priceAtBooking: regularPrice,
      discountAmount: 0,
      discountPercentage: 0,
    };
  }

  const discountAmount =
    Math.round(
      (regularPrice *
        PLAYGROUND_OFF_PEAK_DISCOUNT_PERCENTAGE) /
        100
    );

  const priceAtBooking = Math.max(
    0,
    regularPrice - discountAmount
  );

  return {
    regularPrice,
    priceAtBooking,
    discountAmount,
    discountPercentage:
      PLAYGROUND_OFF_PEAK_DISCOUNT_PERCENTAGE,
  };
}

function isExclusiveService(service) {
  return service.exclusive === true;
}

function getResourceKey(
  facility,
  service
) {
  if (isPlaygroundFacility(facility)) {
    return `playground:${facility._id.toString()}`;
  }

  if (isExclusiveService(service)) {
    return `exclusive:${facility._id.toString()}:${service._id.toString()}`;
  }

  return `service:${facility._id.toString()}:${service._id.toString()}`;
}

function getSliceTimes(
  startTime,
  durationMinutes
) {
  const start =
    timeToMinutes(startTime);

  if (start === null) return [];

  const result = [];

  const sliceCount = Math.ceil(
    durationMinutes /
      TIME_SLICE_MINUTES
  );

  for (
    let index = 0;
    index < sliceCount;
    index += 1
  ) {
    result.push(
      minutesToTime(
        start +
          index * TIME_SLICE_MINUTES
      )
    );
  }

  return result;
}

function getRequiredCapacityUnits(
  service,
  quantity
) {
  if (isExclusiveService(service)) {
    return [0];
  }

  if (
    service.pricingType ===
    "per_booking"
  ) {
    return [0];
  }

  return Array.from(
    { length: quantity },
    (_, index) => index
  );
}

function buildLockRequests({
  booking,
  facility,
  service,
}) {
  const resourceKey =
    getResourceKey(
      facility,
      service
    );

  const sliceTimes =
    getSliceTimes(
      booking.startTime,
      booking.durationMinutes
    );

  const units =
    getRequiredCapacityUnits(
      service,
      booking.quantity
    );

  const requests = [];

  for (const timeSlice of sliceTimes) {
    for (const unit of units) {
      requests.push({
        bookingGroupReference:
          booking.bookingGroupReference,

        bookingId: booking._id,

        facilityId: facility._id,

        serviceId: service._id,

        bookingDate:
          booking.bookingDate,

        resourceKey,

        timeSlice,

        unit,

        expiresAt:
          booking.expiresAt,
      });
    }
  }

  return requests;
}

async function removeExpiredLocks() {
  await BookingLock.deleteMany({
    expiresAt: {
      $lte: new Date(),
    },
  });
}

async function cancelExpiredBookings() {
  const now = new Date();

  const expiredBookings =
    await Booking.find({
      status: "pending",
      paymentStatus: "pending",
      expiresAt: {
        $ne: null,
        $lte: now,
      },
    }).select(
      "_id bookingGroupReference"
    );

  if (!expiredBookings.length) {
    return;
  }

  const bookingIds =
    expiredBookings.map(
      (booking) => booking._id
    );

  const groupReferences = [
    ...new Set(
      expiredBookings
        .map(
          (booking) =>
            booking.bookingGroupReference
        )
        .filter(Boolean)
    ),
  ];

  await Booking.updateMany(
    {
      _id: {
        $in: bookingIds,
      },
      status: "pending",
      paymentStatus: "pending",
    },
    {
      $set: {
        status: "cancelled",
        paymentStatus: "failed",
        cancelledAt: now,
        expiresAt: null,
        cancellationReason:
          "Payment session expired.",
      },
    }
  );

  if (groupReferences.length) {
    await BookingLock.deleteMany({
      bookingGroupReference: {
        $in: groupReferences,
      },
    });
  }
}

async function cleanupExpiredReservations() {
  await cancelExpiredBookings();
  await removeExpiredLocks();
}

async function releaseGroupLocks(
  bookingGroupReference
) {
  if (!bookingGroupReference) return;

  await BookingLock.deleteMany({
    bookingGroupReference,
  });
}

async function releaseBookingLocks(
  bookingId
) {
  if (!bookingId) return;

  await BookingLock.deleteMany({
    bookingId,
  });
}

async function createLocksAtomically({
  booking,
  facility,
  service,
}) {
  const lockRequests =
    buildLockRequests({
      booking,
      facility,
      service,
    });

  if (!lockRequests.length) {
    return {
      success: true,
      locks: [],
    };
  }

  try {
    const locks =
      await BookingLock.insertMany(
        lockRequests,
        {
          ordered: true,
        }
      );

    return {
      success: true,
      locks,
    };
  } catch (error) {
    await releaseBookingLocks(
      booking._id
    );

    if (error?.code === 11000) {
      return {
        success: false,
        conflict: true,
      };
    }

    throw error;
  }
}

async function findExistingBookingsForItem({
  facilityId,
  serviceId,
  bookingDate,
  startTime,
  endTime,
}) {
  const dateStart =
    getDateStartUtc(bookingDate);

  const dateEnd =
    getDateEndUtc(bookingDate);

  return Booking.find({
    facilityId,

    bookingDate: {
      $gte: dateStart,
      $lt: dateEnd,
    },

    status: {
      $in:
        ACTIVE_BOOKING_STATUSES,
    },

    paymentStatus: {
      $in: [
        "unpaid",
        "pending",
        "paid",
      ],
    },

    startTime: {
      $lt: endTime,
    },

    endTime: {
      $gt: startTime,
    },
  }).select(
    "_id facilityId serviceId serviceName startTime endTime quantity status paymentStatus"
  );
}

function calculateExistingQuantity({
  bookings,
  serviceId,
}) {
  return bookings
    .filter(
      (booking) =>
        booking.serviceId?.toString() ===
        serviceId.toString()
    )
    .reduce(
      (total, booking) =>
        total +
        Number(
          booking.quantity || 0
        ),
      0
    );
}

function hasPlaygroundOverlap(
  bookings
) {
  return bookings.some(
    (booking) =>
      ACTIVE_BOOKING_STATUSES.includes(
        booking.status
      )
  );
}

function getBookingDateTimeString(
  date,
  time
) {
  return `${date} ${time}`;
}

function validateMovieSession(
  startTime,
  endTime
) {
  return FIXED_MOVIE_SESSIONS.some(
    (session) =>
      session.startTime ===
        startTime &&
      session.endTime ===
        endTime
  );
}

function createBookingReference() {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    new mongoose.Types.ObjectId()
      .toString()
      .slice(-8)
      .toUpperCase();

  return `CP-${timestamp}-${random}`;
}

function createBookingGroupReference() {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    new mongoose.Types.ObjectId()
      .toString()
      .slice(-8)
      .toUpperCase();

  return `CPG-${timestamp}-${random}`;
}

function createPaymentTransactionId() {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    new mongoose.Types.ObjectId()
      .toString()
      .slice(-8)
      .toUpperCase();

  return `CPAY${timestamp}${random}`;
}

function getExpiryDate() {
  return new Date(
    Date.now() +
      BOOKING_EXPIRY_MINUTES *
        60 *
        1000
  );
}

function serializeBooking(
  booking
) {
  return {
    id: booking._id.toString(),

    bookingReference:
      booking.bookingReference,

    bookingGroupReference:
      booking.bookingGroupReference,

    facilityId:
      booking.facilityId.toString(),

    facilityName:
      booking.facilityName,

    serviceId:
      booking.serviceId.toString(),

    serviceName:
      booking.serviceName,

    bookingDate:
      booking.bookingDate,

    startTime:
      booking.startTime,

    endTime:
      booking.endTime,

    durationMinutes:
      booking.durationMinutes,

    quantity:
      booking.quantity,

    priceAtBooking:
      booking.priceAtBooking,

    totalAmount:
      booking.totalAmount,

    movieName:
      booking.movieName,

    status:
      booking.status,

    paymentStatus:
      booking.paymentStatus,

    paymentTransactionId:
      booking.paymentTransactionId,

    expiresAt:
      booking.expiresAt,
  };
}

export async function POST(
  request
) {
  let createdBookingIds = [];

  let bookingGroupReference = "";

  let locksCreated = false;

  try {
    await connectDB();

    await cleanupExpiredReservations();

    const body =
      await request.json();

    const customer =
      body?.customer &&
      typeof body.customer ===
        "object"
        ? body.customer
        : {};

    const customerName =
      normalizeString(
        customer.name ||
          body.customerName
      );

    const customerEmail =
      normalizeEmail(
        customer.email ||
          body.customerEmail
      );

    const customerPhone =
      normalizePhone(
        customer.phone ||
          body.customerPhone
      );

    const rawItems =
      Array.isArray(body?.items)
        ? body.items
        : [];

    if (
      customerName.length < 2 ||
      customerName.length > 100
    ) {
      return jsonError(
        "Please provide a valid customer name."
      );
    }

    if (
      !isValidEmail(
        customerEmail
      ) ||
      customerEmail.length > 200
    ) {
      return jsonError(
        "Please provide a valid customer email."
      );
    }

    if (
      !isValidPhone(
        customerPhone
      )
    ) {
      return jsonError(
        "Please provide a valid customer phone number."
      );
    }

    if (!rawItems.length) {
      return jsonError(
        "Your booking cart is empty."
      );
    }

    if (
      rawItems.length > MAX_ITEMS
    ) {
      return jsonError(
        `You can book a maximum of ${MAX_ITEMS} items at once.`
      );
    }

    const normalizedItems = [];

    for (
      let index = 0;
      index < rawItems.length;
      index += 1
    ) {
      const normalized =
        normalizeItem(
          rawItems[index],
          index
        );

      if (normalized.error) {
        return jsonError(
          normalized.error
        );
      }

      normalizedItems.push(
        normalized
      );
    }

    const facilityIds = [
      ...new Set(
        normalizedItems.map(
          (item) =>
            item.facilityId
        )
      ),
    ];

    const facilities =
      await Facility.find({
        _id: {
          $in:
            facilityIds.map(
              toObjectId
            ),
        },
        active: true,
      });

    const facilityMap =
      new Map(
        facilities.map(
          (facility) => [
            facility._id.toString(),
            facility,
          ]
        )
      );

    const preparedBookings = [];

    const expiryDate =
      getExpiryDate();

    bookingGroupReference =
      createBookingGroupReference();

    const paymentTransactionId =
      createPaymentTransactionId();

    for (
      let index = 0;
      index < normalizedItems.length;
      index += 1
    ) {
      const item =
        normalizedItems[index];

      const facility =
        facilityMap.get(
          item.facilityId
        );

      if (!facility) {
        return jsonError(
          `Facility not found for item ${
            index + 1
          }.`
        );
      }

      const service =
        facility.services.id(
          item.serviceId
        );

      if (!service) {
        return jsonError(
          `Service not found for item ${
            index + 1
          }.`
        );
      }

      if (!service.active) {
        return jsonError(
          `${service.name} is currently unavailable.`
        );
      }

      const quantity =
        item.quantity;

      const minimumQuantity =
        Number(
          service.minimumQuantity ||
            1
        );

      const maximumQuantity =
        service.maximumQuantity ==
        null
          ? null
          : Number(
              service.maximumQuantity
            );

      if (
        quantity <
        minimumQuantity
      ) {
        return jsonError(
          `${service.name} requires at least ${minimumQuantity} quantity.`
        );
      }

      if (
        maximumQuantity !==
          null &&
        quantity >
          maximumQuantity
      ) {
        return jsonError(
          `${service.name} allows a maximum of ${maximumQuantity} quantity.`
        );
      }

      if (
        isDateInPast(
          item.date
        )
      ) {
        return jsonError(
          `Booking date for ${service.name} cannot be in the past.`
        );
      }

      const dayOfWeek =
        getDayOfWeek(
          item.date
        );

      /*
       * Membership:
       * No time-slot selection.
       * One entry for the whole operating day.
       *
       * Membership pricing remains unchanged.
       */

      if (
        isMembershipService(
          service
        )
      ) {
        if (quantity !== 1) {
          return jsonError(
            `${service.name} allows one membership entry per booking.`
          );
        }

        const startTime =
          "11:00";

        const endTime =
          "23:00";

        const durationMinutes =
          720;

        const schedule =
          getScheduleForBooking(
            facility,
            dayOfWeek,
            startTime,
            endTime,
            durationMinutes
          );

        const hasActiveScheduleForDay =
          facility.schedules?.some(
            (entry) =>
              entry.active &&
              Number(
                entry.dayOfWeek
              ) === dayOfWeek
          );

        if (
          !hasActiveScheduleForDay
        ) {
          return jsonError(
            `${service.name} is not available on the selected date.`
          );
        }

        const bookingDate =
          dateOnlyToUtc(
            item.date
          );

        const membershipPrice =
          Number(service.price);

        if (
          !Number.isFinite(membershipPrice) ||
          membershipPrice < 0
        ) {
          return jsonError(
            `Invalid price configured for ${service.name}.`
          );
        }

        preparedBookings.push({
          facility,
          service,
          item,
          bookingDate,
          startTime,
          endTime,
          durationMinutes,
          priceAtBooking:
            membershipPrice,
          totalAmount:
            membershipPrice * quantity,
          bookingGroupReference,
          paymentTransactionId,
          expiresAt:
            expiryDate,
          dayOfWeek,
          schedule,
          membership: true,
        });

        continue;
      }

      let startTime =
        item.startTime;

      let endTime =
        item.endTime;

      let durationMinutes;

      /*
       * Movie sessions are fixed.
       */

      if (
        isMovieService(
          service
        )
      ) {
        if (
          !validateMovieSession(
            startTime,
            endTime || ""
          )
        ) {
          return jsonError(
            `${service.name} must use one of the available 3-hour movie sessions.`
          );
        }

        durationMinutes = 180;

        if (!item.movieName) {
          return jsonError(
            "Please provide the movie name."
          );
        }

        if (
          item.movieName.length >
          200
        ) {
          return jsonError(
            "Movie name is too long."
          );
        }
      } else {
        durationMinutes =
          Number(
            service.durationMinutes
          );

        if (
          !Number.isFinite(
            durationMinutes
          ) ||
          durationMinutes < 1
        ) {
          return jsonError(
            `Invalid duration configured for ${service.name}.`
          );
        }

        const calculatedEndTime =
          addMinutes(
            startTime,
            durationMinutes
          );

        if (
          !calculatedEndTime
        ) {
          return jsonError(
            `Invalid start time for ${service.name}.`
          );
        }

        endTime =
          calculatedEndTime;
      }

      const startMinutes =
        timeToMinutes(
          startTime
        );

      const endMinutes =
        timeToMinutes(
          endTime
        );

      if (
        startMinutes === null ||
        endMinutes === null
      ) {
        return jsonError(
          `Invalid booking time for ${service.name}.`
        );
      }

      if (
        startMinutes <
          OPEN_TIME ||
        endMinutes >
          CLOSE_TIME ||
        endMinutes <=
          startMinutes
      ) {
        return jsonError(
          `${service.name} is only available between 11:00 and 23:00.`
        );
      }

      if (
        !isMovieService(
          service
        ) &&
        !isTimeAligned(
          startTime
        )
      ) {
        return jsonError(
          `Invalid start time for ${service.name}.`
        );
      }

      const schedule =
        getScheduleForBooking(
          facility,
          dayOfWeek,
          startTime,
          endTime,
          durationMinutes
        );

      if (!schedule) {
        if (
          !isMovieService(
            service
          )
        ) {
          return jsonError(
            `${service.name} is not available at ${startTime} on the selected date.`
          );
        }
      }

      const bookingDate =
        dateOnlyToUtc(
          item.date
        );

      /*
       * FIRST AVAILABILITY CHECK
       */

      const existingBookings =
        await findExistingBookingsForItem(
          {
            facilityId:
              facility._id,

            serviceId:
              service._id,

            bookingDate:
              item.date,

            startTime,

            endTime,
          }
        );

      /*
       * Playground is a shared physical resource.
       */

      if (
        isPlaygroundFacility(
          facility
        ) &&
        isPlaygroundActivity(
          service
        )
      ) {
        if (
          hasPlaygroundOverlap(
            existingBookings
          )
        ) {
          return jsonError(
            `${service.name} is already booked for the selected time. Please choose another time.`
          );
        }
      }

      /*
       * Exclusive service.
       */

      if (
        isExclusiveService(
          service
        )
      ) {
        if (
          existingBookings.length >
          0
        ) {
          return jsonError(
            `${service.name} is already booked for the selected time.`
          );
        }
      }

      /*
       * Private Movie.
       */

      if (
        isMovieService(
          service
        )
      ) {
        const capacity =
          Number(
            service.capacity ||
              50
          );

        const used =
          calculateExistingQuantity(
            {
              bookings:
                existingBookings,

              serviceId:
                service._id,
            }
          );

        if (
          used + quantity >
          capacity
        ) {
          return jsonError(
            `Only ${Math.max(
              0,
              capacity - used
            )} movie tickets remain for this session.`
          );
        }
      }

      /*
       * Normal capacity services.
       */

      if (
        !isMovieService(
          service
        ) &&
        !isExclusiveService(
          service
        ) &&
        !isPlaygroundFacility(
          facility
        )
      ) {
        const capacity =
          service.capacity ==
          null
            ? null
            : Number(
                service.capacity
              );

        if (
          capacity !== null &&
          Number.isFinite(
            capacity
          )
        ) {
          const used =
            calculateExistingQuantity(
              {
                bookings:
                  existingBookings,

                serviceId:
                  service._id,
              }
            );

          if (
            used + quantity >
            capacity
          ) {
            return jsonError(
              `Only ${Math.max(
                0,
                capacity - used
              )} spaces remain for ${service.name}.`
            );
          }
        }
      }

      /*
       * SERVER-SIDE PRICE CALCULATION
       *
       * The regular price is read from MongoDB.
       * Only eligible Playground activities receive
       * the 30% off-peak discount.
       *
       * priceAtBooking stores the final unit price.
       * totalAmount stores the final amount for quantity.
       */

      const priceDetails =
        calculateBookingPrice({
          facility,
          service,
          startTime,
        });

      if (priceDetails.error) {
        return jsonError(
          priceDetails.error
        );
      }

      const priceAtBooking =
        priceDetails.priceAtBooking;

      const totalAmount =
        priceAtBooking * quantity;

      if (
        !Number.isFinite(
          totalAmount
        ) ||
        totalAmount < 0
      ) {
        return jsonError(
          `Invalid booking amount for ${service.name}.`
        );
      }

      preparedBookings.push({
        facility,
        service,
        item,
        bookingDate,
        startTime,
        endTime,
        durationMinutes,
        priceAtBooking,
        totalAmount,
        bookingGroupReference,
        paymentTransactionId,
        expiresAt:
          expiryDate,
        dayOfWeek,
        schedule,
        membership: false,
      });
    }

    /*
     * Build Booking documents.
     */

    const bookingDocuments =
      preparedBookings.map(
        (prepared) => ({
          bookingReference:
            createBookingReference(),

          bookingGroupReference:
            prepared.bookingGroupReference,

          customerName,

          customerEmail,

          customerPhone,

          facilityId:
            prepared.facility._id,

          facilityName:
            prepared.facility.name,

          serviceId:
            prepared.service._id,

          serviceName:
            prepared.service.name,

          bookingDate:
            prepared.bookingDate,

          startTime:
            prepared.startTime,

          endTime:
            prepared.endTime,

          durationMinutes:
            prepared.durationMinutes,

          quantity:
            prepared.item.quantity,

          priceAtBooking:
            prepared.priceAtBooking,

          totalAmount:
            prepared.totalAmount,

          movieName:
            prepared.item.movieName ||
            "",

          status: "pending",

          paymentStatus:
            "pending",

          paymentTransactionId:
            prepared.paymentTransactionId,

          paymentValidationId:
            "",

          paymentBankTransactionId:
            "",

          paymentCardType:
            "",

          paymentMethod:
            "",

          paymentInitiatedAt:
            null,

          paymentPaidAt:
            null,

          expiresAt:
            prepared.expiresAt,

          checkedIn: false,

          checkedInAt: null,

          checkedOut: false,

          checkedOutAt: null,

          cancelledAt: null,

          cancellationReason:
            "",
        })
      );

    /*
     * Insert bookings first.
     */

    const insertedBookings =
      await Booking.insertMany(
        bookingDocuments,
        {
          ordered: true,
        }
      );

    createdBookingIds =
      insertedBookings.map(
        (booking) =>
          booking._id
      );

    /*
     * Atomically claim physical capacity.
     */

    for (
      let index = 0;
      index <
      preparedBookings.length;
      index += 1
    ) {
      const prepared =
        preparedBookings[index];

      const booking =
        insertedBookings[index];

      if (prepared.membership) {
        continue;
      }

      const lockResult =
        await createLocksAtomically(
          {
            booking,

            facility:
              prepared.facility,

            service:
              prepared.service,
          }
        );

      if (
        !lockResult.success
      ) {
        await releaseGroupLocks(
          bookingGroupReference
        );

        await Booking.deleteMany(
          {
            _id: {
              $in:
                createdBookingIds,
            },

            status:
              "pending",

            paymentStatus:
              "pending",
          }
        );

        createdBookingIds = [];

        return jsonError(
          "One or more selected booking slots were just taken by another customer. Please refresh the availability and try again.",
          409,
          {
            code:
              "BOOKING_CONFLICT",
          }
        );
      }

      locksCreated = true;
    }

    const totalAmount =
      insertedBookings.reduce(
        (total, booking) =>
          total +
          Number(
            booking.totalAmount ||
              0
          ),
        0
      );

    /*
     * Final DB verification.
     */

    const savedBookings =
      await Booking.find({
        _id: {
          $in:
            createdBookingIds,
        },

        bookingGroupReference,

        paymentTransactionId,

        status:
          "pending",

        paymentStatus:
          "pending",
      }).sort({
        createdAt: 1,
      });

    if (
      savedBookings.length !==
      insertedBookings.length
    ) {
      await releaseGroupLocks(
        bookingGroupReference
      );

      await Booking.deleteMany(
        {
          _id: {
            $in:
              createdBookingIds,
          },

          status:
            "pending",

          paymentStatus:
            "pending",
        }
      );

      return jsonError(
        "Unable to safely create the booking. Please try again.",
        500
      );
    }

    return jsonSuccess(
      {
        bookingGroupReference,

        paymentTransactionId,

        bookingCount:
          savedBookings.length,

        totalAmount,

        currency: "BDT",

        expiresAt:
          expiryDate,

        bookings:
          savedBookings.map(
            serializeBooking
          ),
      },
      201
    );
  } catch (error) {
    console.error(
      "Booking creation error:",
      error
    );

    try {
      if (
        bookingGroupReference
      ) {
        await releaseGroupLocks(
          bookingGroupReference
        );
      }

      if (
        createdBookingIds.length
      ) {
        await Booking.deleteMany(
          {
            _id: {
              $in:
                createdBookingIds,
            },

            status:
              "pending",

            paymentStatus:
              "pending",
          }
        );
      }
    } catch (cleanupError) {
      console.error(
        "Booking cleanup error:",
        cleanupError
      );
    }

    if (
      error?.code === 11000
    ) {
      return jsonError(
        "The selected booking slot was just taken by another customer. Please refresh and try again.",
        409,
        {
          code:
            "BOOKING_CONFLICT",
        }
      );
    }

    return jsonError(
      "Unable to create the booking right now. Please try again.",
      500
    );
  }
}