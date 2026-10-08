import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Booking from "@/models/booking";
import BookingLock from "@/models/bookingLock";
import Facility from "@/models/facility";
import Membership from "@/models/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_VALIDATION_URL =
  "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

const SANDBOX_VALIDATION_URL =
  "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

const SUCCESS_STATUSES = [
  "VALID",
  "VALIDATED",
];

/*
============================================================
GENERAL HELPERS
============================================================
*/

function normalizeString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getSSLCredentials() {
  const storeId = normalizeString(
    process.env.SSLCOMMERZ_STORE_ID
  );

  const storePassword = normalizeString(
    process.env.SSLCOMMERZ_STORE_PASSWORD
  );

  if (!storeId || !storePassword) {
    return null;
  }

  return {
    storeId,
    storePassword,
  };
}

function isSandbox() {
  return (
    String(process.env.SSLCOMMERZ_IS_LIVE)
      .trim()
      .toLowerCase() !== "true"
  );
}

function parseAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount
    : null;
}

function amountsMatch(expected, received) {
  const a = Number(expected);
  const b = Number(received);

  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b)
  ) {
    return false;
  }

  return Math.abs(a - b) < 0.01;
}

function getValidationURL() {
  return isSandbox()
    ? SANDBOX_VALIDATION_URL
    : LIVE_VALIDATION_URL;
}

function safeIPNResponse(
  message,
  status = 200
) {
  return NextResponse.json(
    {
      success:
        status >= 200 &&
        status < 300,

      message,
    },
    { status }
  );
}

/*
============================================================
REQUEST PARSER
============================================================
*/

async function readRequestData(request) {
  const contentType =
    request.headers.get("content-type") || "";

  if (
    contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }

  try {
    const formData =
      await request.formData();

    const data = {};

    for (const [
      key,
      value,
    ] of formData.entries()) {
      data[key] =
        typeof value === "string"
          ? value
          : String(value);
    }

    return data;
  } catch {
    return {};
  }
}

/*
============================================================
EXPIRED BOOKING CLEANUP
============================================================
*/

async function cleanupExpiredBookings() {
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

  await BookingLock.deleteMany({
    expiresAt: {
      $ne: null,
      $lte: now,
    },
  });
}

/*
============================================================
MEMBERSHIP HELPERS
============================================================
*/

/*
 * Membership service identification is based ONLY on
 * the actual service stored in MongoDB.
 *
 * The client never controls membershipType or facilities.
 */

function getMembershipDefinition(service) {
  if (!service) {
    return null;
  }

  const slug =
    normalizeString(
      service.slug
    ).toLowerCase();

  switch (slug) {
    case "gym-monthly":
      return {
        membershipType: "gym",

        facilities: [
          "gym",
        ],
      };

    case "pool-monthly":
      return {
        membershipType: "pool",

        facilities: [
          "pool",
        ],
      };

    case "gym-pool-monthly":
      return {
        membershipType: "gym_pool",

        facilities: [
          "gym",
          "pool",
        ],
      };

    default:
      return null;
  }
}

/*
 * Add exactly one calendar month while avoiding invalid
 * dates such as January 31 -> February 28/29.
 */

function addOneMonth(date) {
  const source = new Date(date);

  if (
    Number.isNaN(
      source.getTime()
    )
  ) {
    return null;
  }

  const year =
    source.getUTCFullYear();

  const month =
    source.getUTCMonth();

  const day =
    source.getUTCDate();

  const targetMonth =
    month + 1;

  const lastDayOfTargetMonth =
    new Date(
      Date.UTC(
        year,
        targetMonth + 1,
        0
      )
    ).getUTCDate();

  const safeDay =
    Math.min(
      day,
      lastDayOfTargetMonth
    );

  return new Date(
    Date.UTC(
      year,
      targetMonth,
      safeDay
    )
  );
}

/*
============================================================
MEMBERSHIP CODE
============================================================
*/

function getMembershipMonthPrefix(
  date
) {
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const month =
    new Date(date).getUTCMonth();

  return (
    monthNames[month] ||
    "JAN"
  );
}

async function generateMembershipCode(
  startDate
) {
  const prefix =
    getMembershipMonthPrefix(
      startDate
    );

  const existingMemberships =
    await Membership.find({
      membershipCode: {
        $regex: `^${prefix}-[0-9]+$`,
      },
    })
      .select("membershipCode")
      .lean();

  let highestNumber = 1000;

  for (
    const membership of
      existingMemberships
  ) {
    const code =
      normalizeString(
        membership.membershipCode
      );

    const match =
      code.match(
        new RegExp(
          `^${prefix}-(\\d+)$`
        )
      );

    if (!match) {
      continue;
    }

    const number =
      Number(match[1]);

    if (
      Number.isFinite(number) &&
      number > highestNumber
    ) {
      highestNumber =
        number;
    }
  }

  return `${prefix}-${highestNumber + 1}`;
}

/*
============================================================
CREATE MEMBERSHIPS AFTER VERIFIED PAYMENT
============================================================
*/

async function createMembershipsForPaidBookings(
  bookings,
  transactionId
) {
  console.log(
    "========== MEMBERSHIP FUNCTION START =========="
  );

  console.log(
    "Membership provisioning input:",
    {
      transactionId,

      bookingCount:
        bookings.length,

      bookingIds:
        bookings.map(
          (booking) =>
            booking._id?.toString()
        ),
    }
  );

  /*
   * Only confirmed + paid bookings are eligible.
   */

  const membershipBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
          "confirmed" &&
        booking.paymentStatus ===
          "paid"
    );

  console.log(
    "Eligible paid/confirmed bookings:",
    {
      count:
        membershipBookings.length,

      bookings:
        membershipBookings.map(
          (booking) => ({
            bookingId:
              booking._id?.toString(),

            bookingReference:
              booking.bookingReference,

            facilityId:
              booking.facilityId?.toString(),

            serviceId:
              booking.serviceId?.toString(),

            serviceName:
              booking.serviceName,

            quantity:
              booking.quantity,

            priceAtBooking:
              booking.priceAtBooking,
          })
        ),
    }
  );

  if (
    !membershipBookings.length
  ) {
    console.log(
      "No confirmed/paid bookings require membership provisioning."
    );

    return {
      created: 0,
      existing: 0,
    };
  }

  let created = 0;
  let existing = 0;

  /*
   * ========================================================
   * PROCESS EACH BOOKING INDEPENDENTLY
   * ========================================================
   *
   * We intentionally use the exact facilityId and
   * serviceId stored on the booking.
   *
   * We do NOT search all facilities using a stringified
   * service ID.
   */

  for (
    const booking of
      membershipBookings
  ) {
    const bookingId =
      booking._id?.toString();

    const facilityId =
      booking.facilityId;

    const serviceId =
      booking.serviceId;

    console.log(
      "--------------------------------------------------"
    );

    console.log(
      "Processing membership booking:",
      {
        bookingId,

        bookingReference:
          booking.bookingReference,

        facilityId:
          facilityId?.toString(),

        serviceId:
          serviceId?.toString(),

        serviceName:
          booking.serviceName,

        transactionId,
      }
    );

    /*
     * ======================================================
     * BASIC VALIDATION
     * ======================================================
     */

    if (!facilityId) {
      throw new Error(
        `Membership booking ${bookingId} has no facilityId.`
      );
    }

    if (!serviceId) {
      throw new Error(
        `Membership booking ${bookingId} has no serviceId.`
      );
    }

    /*
     * ======================================================
     * FIND EXACT FACILITY
     * ======================================================
     */

    const facility =
      await Facility.findById(
        facilityId
      )
        .select(
          "name slug services"
        )
        .lean();

    if (!facility) {
      throw new Error(
        `Facility ${facilityId} was not found for membership booking ${bookingId}.`
      );
    }

    console.log(
      "Exact facility found:",
      {
        facilityId:
          facility._id?.toString(),

        facilityName:
          facility.name,

        facilitySlug:
          facility.slug,

        serviceCount:
          Array.isArray(
            facility.services
          )
            ? facility.services.length
            : 0,
      }
    );

    /*
     * ======================================================
     * FIND EXACT EMBEDDED SERVICE
     * ======================================================
     */

    const service =
      (
        facility.services || []
      ).find(
        (item) =>
          String(
            item._id
          ) ===
          String(serviceId)
      );

    if (!service) {
      console.error(
        "Booked service was NOT found inside the exact facility:",
        {
          bookingId,

          facilityId:
            facility._id?.toString(),

          facilityName:
            facility.name,

          requestedServiceId:
            String(serviceId),

          availableServices:
            (
              facility.services || []
            ).map(
              (item) => ({
                id:
                  item._id?.toString(),

                name:
                  item.name,

                slug:
                  item.slug,

                type:
                  item.type,

                pricingType:
                  item.pricingType,
              })
            ),
        }
      );

      throw new Error(
        `Service ${serviceId} was not found inside facility ${facilityId} for booking ${bookingId}.`
      );
    }

    console.log(
      "Exact booked service found:",
      {
        serviceId:
          service._id?.toString(),

        serviceName:
          service.name,

        serviceSlug:
          service.slug,

        serviceType:
          service.type,

        pricingType:
          service.pricingType,

        active:
          service.active,
      }
    );

    /*
     * ======================================================
     * IDENTIFY MEMBERSHIP SERVICE
     * ======================================================
     */

    const definition =
      getMembershipDefinition(
        service
      );

    console.log(
      "Membership service detection:",
      {
        bookingId,

        serviceSlug:
          service.slug,

        isMembershipService:
          Boolean(
            definition
          ),

        definition:
          definition || null,
      }
    );

    /*
     * A non-membership service is valid in a mixed cart.
     */

    if (!definition) {
      console.log(
        "Skipping non-membership service:",
        {
          bookingId,

          serviceName:
            service.name,

          serviceSlug:
            service.slug,
        }
      );

      continue;
    }

    /*
     * ======================================================
     * QUANTITY VALIDATION
     * ======================================================
     */

    const quantity =
      Number(
        booking.quantity
      );

    if (
      !Number.isFinite(
        quantity
      ) ||
      quantity !== 1
    ) {
      throw new Error(
        `Invalid membership quantity for booking ${bookingId}.`
      );
    }

    /*
     * ======================================================
     * DATE VALIDATION
     * ======================================================
     */

    const startDate =
      new Date(
        booking.bookingDate
      );

    if (
      Number.isNaN(
        startDate.getTime()
      )
    ) {
      throw new Error(
        `Invalid membership start date for booking ${bookingId}.`
      );
    }

    const expiryDate =
      addOneMonth(
        startDate
      );

    if (!expiryDate) {
      throw new Error(
        `Unable to calculate membership expiry for booking ${bookingId}.`
      );
    }

    /*
     * ======================================================
     * PRICE VALIDATION
     * ======================================================
     *
     * Price comes from the server-side booking record.
     *
     * It is NOT taken from the client or the service price.
     */

    const price =
      Number(
        booking.priceAtBooking
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      throw new Error(
        `Invalid membership price for booking ${bookingId}.`
      );
    }

    /*
     * ======================================================
     * IDEMPOTENCY
     * ======================================================
     */

    const activationNote =
      `Activated via SSLCommerz transaction ${transactionId}`;

    console.log(
      "Checking existing membership:",
      {
        customerEmail:
          booking.customerEmail,

        membershipType:
          definition.membershipType,

        startDate,

        expiryDate,

        activationNote,
      }
    );

    const existingMembership =
      await Membership.findOne({
        customerEmail:
          booking.customerEmail,

        membershipType:
          definition.membershipType,

        startDate,

        expiryDate,

        notes:
          activationNote,
      }).lean();

    if (existingMembership) {
      existing++;

      console.log(
        "Membership already exists:",
        {
          membershipId:
            existingMembership._id.toString(),

          membershipCode:
            existingMembership.membershipCode,

          membershipType:
            existingMembership.membershipType,

          transactionId,

          bookingId,
        }
      );

      continue;
    }

    /*
     * ======================================================
     * GENERATE MEMBERSHIP CODE + CREATE
     * ======================================================
     */

    let membershipCreated =
      false;

    for (
      let attempt = 0;
      attempt < 5;
      attempt++
    ) {
      const membershipCode =
        await generateMembershipCode(
          startDate
        );

      console.log(
        "Generated membership code:",
        {
          membershipCode,

          attempt:
            attempt + 1,

          bookingId,

          transactionId,
        }
      );

      try {
        const membership =
          await Membership.create({
            membershipCode,

            customerName:
              booking.customerName,

            customerEmail:
              booking.customerEmail,

            customerPhone:
              booking.customerPhone,

            membershipType:
              definition.membershipType,

            facilities:
              definition.facilities,

            price,

            startDate,

            expiryDate,

            active: true,

            dailyEntries: [],

            renewalHistory: [],

            lastRenewedAt:
              null,

            renewalCount: 0,

            notes:
              activationNote,
          });

        console.log(
          "========== MEMBERSHIP CREATED =========="
        );

        console.log({
          membershipId:
            membership._id.toString(),

          membershipCode:
            membership.membershipCode,

          membershipType:
            membership.membershipType,

          facilities:
            membership.facilities,

          customerEmail:
            membership.customerEmail,

          startDate:
            membership.startDate,

          expiryDate:
            membership.expiryDate,

          price:
            membership.price,

          transactionId,

          bookingId,
        });

        created++;

        membershipCreated =
          true;

        break;
      } catch (error) {
        /*
         * Only retry when the unique membership code
         * collides.
         */

        if (
          error?.code === 11000 &&
          error?.keyPattern
            ?.membershipCode
        ) {
          console.warn(
            "Membership code collision. Retrying:",
            {
              transactionId,

              bookingId,

              attempt:
                attempt + 1,

              membershipCode,
            }
          );

          continue;
        }

        /*
         * Any other error is a real provisioning failure.
         */

        console.error(
          "Membership.create() failed:",
          {
            bookingId,

            transactionId,

            error,
          }
        );

        throw error;
      }
    }

    if (!membershipCreated) {
      throw new Error(
        `Unable to generate a unique membership code for booking ${bookingId}.`
      );
    }
  }

  console.log(
    "========== MEMBERSHIP FUNCTION COMPLETE =========="
  );

  console.log({
    transactionId,

    created,

    existing,
  });

  return {
    created,
    existing,
  };
}

/*
============================================================
POST
============================================================
*/

export async function POST(
  request
) {
  try {
    await connectDB();

    /*
     * Clean stale bookings/locks before processing
     * another payment notification.
     */

    await cleanupExpiredBookings();

    console.log(
      "========== SSL IPN START =========="
    );

    console.log(
      "SSLCommerz environment:",
      isSandbox()
        ? "SANDBOX"
        : "LIVE"
    );

    console.log(
      "IPN validation URL:",
      getValidationURL()
    );

    const credentials =
      getSSLCredentials();

    if (!credentials) {
      console.error(
        "SSLCommerz credentials are not configured."
      );

      return safeIPNResponse(
        "Payment gateway is not configured.",
        500
      );
    }

    const data =
      await readRequestData(
        request
      );

    console.log(
      "========== SSL IPN RECEIVED =========="
    );

    /*
     * WARNING:
     *
     * Do not log store passwords or credentials.
     *
     * The gateway payload itself is currently logged
     * because this route is being diagnosed.
     */

    console.log(
      "IPN data:",
      data
    );

    const tranId =
      normalizeString(
        data.tran_id
      );

    const valId =
      normalizeString(
        data.val_id
      );

    const ipnStatus =
      normalizeString(
        data.status
      ).toUpperCase();

    const ipnAmount =
      parseAmount(
        data.amount
      );

    const ipnCurrency =
      normalizeString(
        data.currency
      ).toUpperCase();

    const ipnGroupReference =
      normalizeString(
        data.value_a
      ).toUpperCase();

    console.log(
      "IPN parsed:",
      {
        tranId,

        valId,

        ipnStatus,

        ipnAmount,

        ipnCurrency,

        ipnGroupReference,
      }
    );

    if (!tranId) {
      console.error(
        "IPN missing transaction ID."
      );

      return safeIPNResponse(
        "Missing transaction ID.",
        400
      );
    }

    /*
     * ========================================================
     * FIND BOOKING GROUP
     * ========================================================
     */

    const bookings =
      await Booking.find({
        paymentTransactionId:
          tranId,
      });

    console.log(
      "Bookings found for transaction:",
      bookings.length
    );

    if (!bookings.length) {
      console.error(
        "IPN transaction not found:",
        tranId
      );

      return safeIPNResponse(
        "Transaction not found.",
        404
      );
    }

    /*
     * ========================================================
     * GROUP CONSISTENCY
     * ========================================================
     */

    const bookingGroupReference =
      bookings[0]
        .bookingGroupReference;

    const groupMismatch =
      bookings.some(
        (booking) =>
          booking.bookingGroupReference !==
          bookingGroupReference
      );

    if (groupMismatch) {
      console.error(
        "Inconsistent booking group:",
        tranId
      );

      return safeIPNResponse(
        "Invalid booking group.",
        500
      );
    }

    /*
     * ========================================================
     * VERIFY value_a
     * ========================================================
     */

    if (
      ipnGroupReference &&
      ipnGroupReference !==
        bookingGroupReference
    ) {
      console.error(
        "IPN group reference mismatch:",
        {
          tranId,

          expected:
            bookingGroupReference,

          received:
            ipnGroupReference,
        }
      );

      return safeIPNResponse(
        "Booking group mismatch.",
        400
      );
    }

    /*
     * ========================================================
     * ALREADY PAID
     * ========================================================
     *
     * We still run membership provisioning.
     *
     * This is important because the payment may have been
     * confirmed before membership creation succeeded.
     */

    const allAlreadyPaid =
      bookings.every(
        (booking) =>
          booking.paymentStatus ===
            "paid" &&
          booking.status ===
            "confirmed"
      );

    if (allAlreadyPaid) {
      console.log(
        "Payment was already processed:",
        tranId
      );

      await BookingLock.updateMany(
        {
          bookingGroupReference:
            bookingGroupReference,
        },
        {
          $set: {
            expiresAt:
              null,
          },
        }
      );

      try {
        const membershipResult =
          await createMembershipsForPaidBookings(
            bookings,
            tranId
          );

        console.log(
          "Membership provisioning for already-paid transaction:",
          membershipResult
        );
      } catch (error) {
        console.error(
          "Membership provisioning failed for already-paid transaction:",
          error
        );

        return safeIPNResponse(
          "Payment is confirmed but membership provisioning requires retry.",
          503
        );
      }

      return safeIPNResponse(
        "Payment already processed.",
        200
      );
    }

    /*
     * ========================================================
     * NON-SUCCESSFUL IPN
     * ========================================================
     */

    if (
      !SUCCESS_STATUSES.includes(
        ipnStatus
      )
    ) {
      console.warn(
        "SSLCommerz IPN is not successful:",
        {
          tranId,

          status:
            ipnStatus,
        }
      );

      if (
        ipnStatus ===
          "FAILED" ||
        ipnStatus ===
          "CANCELLED" ||
        ipnStatus ===
          "CANCELED"
      ) {
        const failedResult =
          await Booking.updateMany(
            {
              paymentTransactionId:
                tranId,

              status:
                "pending",

              paymentStatus:
                "pending",
            },
            {
              $set: {
                status:
                  "cancelled",

                paymentStatus:
                  "failed",

                cancelledAt:
                  new Date(),

                expiresAt:
                  null,

                cancellationReason:
                  `SSLCommerz payment status: ${ipnStatus}`,
              },
            }
          );

        console.log(
          "Failed/cancelled bookings updated:",
          failedResult
        );

        await BookingLock.deleteMany(
          {
            bookingGroupReference:
              bookingGroupReference,
          }
        );
      }

      return safeIPNResponse(
        `Payment status received: ${
          ipnStatus ||
          "UNKNOWN"
        }.`,
        200
      );
    }

    /*
     * ========================================================
     * SUCCESSFUL IPN REQUIRES val_id
     * ========================================================
     */

    if (!valId) {
      console.error(
        "Successful SSLCommerz IPN has no val_id:",
        tranId
      );

      return safeIPNResponse(
        "Validation ID is missing.",
        400
      );
    }

    /*
     * ========================================================
     * CALL SSLCOMMERZ VALIDATION API
     * ========================================================
     */

    const validationURL =
      getValidationURL();

    const validationParams =
      new URLSearchParams();

    validationParams.set(
      "val_id",
      valId
    );

    validationParams.set(
      "store_id",
      credentials.storeId
    );

    validationParams.set(
      "store_passwd",
      credentials.storePassword
    );

    validationParams.set(
      "v",
      "1"
    );

    validationParams.set(
      "format",
      "json"
    );

    console.log(
      "Calling SSLCommerz validation:",
      {
        environment:
          isSandbox()
            ? "SANDBOX"
            : "LIVE",

        url:
          validationURL,

        tranId,

        valId,
      }
    );

    let validationResponse;

    try {
      validationResponse =
        await fetch(
          `${validationURL}?${validationParams.toString()}`,
          {
            method: "GET",

            cache:
              "no-store",

            signal:
              AbortSignal.timeout(
                30000
              ),
          }
        );
    } catch (error) {
      console.error(
        "SSLCommerz validation request failed:",
        error
      );

      return safeIPNResponse(
        "Payment validation service temporarily unavailable.",
        503
      );
    }

    console.log(
      "SSLCommerz validation HTTP status:",
      validationResponse.status
    );

    if (
      !validationResponse.ok
    ) {
      console.error(
        "SSLCommerz validation HTTP error:",
        validationResponse.status
      );

      return safeIPNResponse(
        "Payment validation failed temporarily.",
        503
      );
    }

    /*
     * ========================================================
     * PARSE VALIDATION RESPONSE
     * ========================================================
     */

    let validation;

    try {
      validation =
        await validationResponse.json();

      console.log(
        "========== SSL VALIDATION RESPONSE =========="
      );

      console.log(
        "Validation response:",
        validation
      );
    } catch {
      console.error(
        "SSLCommerz validation returned invalid JSON."
      );

      return safeIPNResponse(
        "Invalid payment validation response.",
        502
      );
    }

    /*
     * ========================================================
     * VALIDATION STATUS
     * ========================================================
     */

    const validationStatus =
      normalizeString(
        validation?.status
      ).toUpperCase();

    console.log(
      "SSLCommerz validation status:",
      validationStatus
    );

    if (
      !SUCCESS_STATUSES.includes(
        validationStatus
      )
    ) {
      console.error(
        "SSLCommerz transaction validation failed:",
        {
          tranId,

          valId,

          status:
            validationStatus,
        }
      );

      return safeIPNResponse(
        "Payment could not be validated.",
        400
      );
    }

    /*
     * ========================================================
     * VALIDATE TRANSACTION ID
     * ========================================================
     */

    const validatedTranId =
      normalizeString(
        validation?.tran_id
      );

    if (
      !validatedTranId ||
      validatedTranId !==
        tranId
    ) {
      console.error(
        "SSLCommerz transaction ID mismatch:",
        {
          received:
            tranId,

          validated:
            validatedTranId,
        }
      );

      return safeIPNResponse(
        "Transaction validation mismatch.",
        400
      );
    }

    /*
     * ========================================================
     * VALIDATE CURRENCY
     * ========================================================
     */

    const validatedCurrency =
      normalizeString(
        validation?.currency
      ).toUpperCase();

    if (
      validatedCurrency !==
      "BDT"
    ) {
      console.error(
        "SSLCommerz currency mismatch:",
        {
          tranId,

          currency:
            validatedCurrency,
        }
      );

      return safeIPNResponse(
        "Invalid payment currency.",
        400
      );
    }

    if (
      ipnCurrency &&
      ipnCurrency !==
        "BDT"
    ) {
      console.error(
        "IPN currency mismatch:",
        {
          tranId,

          currency:
            ipnCurrency,
        }
      );

      return safeIPNResponse(
        "Invalid IPN currency.",
        400
      );
    }

    /*
     * ========================================================
     * CALCULATE EXPECTED AMOUNT FROM DATABASE
     * ========================================================
     */

    const expectedAmount =
      bookings.reduce(
        (
          total,
          booking
        ) => {
          const amount =
            Number(
              booking.totalAmount
            );

          if (
            !Number.isFinite(
              amount
            )
          ) {
            return NaN;
          }

          return (
            total +
            amount
          );
        },
        0
      );

    console.log(
      "Expected booking amount:",
      expectedAmount
    );

    if (
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount <= 0
    ) {
      console.error(
        "Invalid database payment amount:",
        {
          tranId,

          expectedAmount,
        }
      );

      return safeIPNResponse(
        "Invalid booking payment amount.",
        500
      );
    }

    /*
     * ========================================================
     * VALIDATE SSLCOMMERZ AMOUNT
     * ========================================================
     */

    const validatedAmount =
      parseAmount(
        validation?.amount
      );

    console.log(
      "Payment amounts:",
      {
        expectedAmount,

        validatedAmount,

        ipnAmount,
      }
    );

    if (
      validatedAmount ===
        null ||
      !amountsMatch(
        expectedAmount,
        validatedAmount
      )
    ) {
      console.error(
        "SSLCommerz amount mismatch:",
        {
          tranId,

          expectedAmount,

          ipnAmount,

          validatedAmount,
        }
      );

      return safeIPNResponse(
        "Payment amount does not match the booking.",
        400
      );
    }

    if (
      ipnAmount !== null &&
      !amountsMatch(
        expectedAmount,
        ipnAmount
      )
    ) {
      console.error(
        "IPN amount mismatch:",
        {
          tranId,

          expectedAmount,

          ipnAmount,
        }
      );

      return safeIPNResponse(
        "IPN payment amount mismatch.",
        400
      );
    }

    /*
     * ========================================================
     * EXPIRY CHECK
     * ========================================================
     */

    const currentTime =
      Date.now();

    const hasExpiredBooking =
      bookings.some(
        (booking) =>
          booking.status ===
            "pending" &&
          booking.paymentStatus ===
            "pending" &&
          booking.expiresAt &&
          new Date(
            booking.expiresAt
          ).getTime() <=
            currentTime
      );

    if (
      hasExpiredBooking
    ) {
      const expirationDate =
        new Date();

      console.warn(
        "Validated payment arrived after booking expiry:",
        {
          tranId,

          bookingGroupReference,

          expiresAt:
            bookings.map(
              (booking) =>
                booking.expiresAt
            ),
        }
      );

      await Booking.updateMany(
        {
          paymentTransactionId:
            tranId,

          status:
            "pending",

          paymentStatus:
            "pending",
        },
        {
          $set: {
            status:
              "cancelled",

            paymentStatus:
              "failed",

            cancelledAt:
              expirationDate,

            expiresAt:
              null,

            cancellationReason:
              "Payment was validated after the booking session expired.",
          },
        }
      );

      await BookingLock.deleteMany(
        {
          bookingGroupReference:
            bookingGroupReference,
        }
      );

      return safeIPNResponse(
        "Payment was validated after the booking session expired. The booking was not confirmed.",
        409
      );
    }

    /*
     * ========================================================
     * RISK HANDLING
     * ========================================================
     */

    const riskLevel =
      String(
        validation?.risk_level ??
          data?.risk_level ??
          ""
      ).trim();

    console.log(
      "SSLCommerz risk level:",
      riskLevel ||
        "not provided"
    );

    if (
      riskLevel === "1"
    ) {
      console.warn(
        "High-risk SSLCommerz transaction requires review:",
        tranId
      );

      await Booking.updateMany(
        {
          paymentTransactionId:
            tranId,

          paymentStatus:
            "pending",
        },
        {
          $set: {
            paymentValidationId:
              valId,

            paymentBankTransactionId:
              normalizeString(
                validation?.bank_tran_id
              ),

            paymentCardType:
              normalizeString(
                validation?.card_type
              ),

            paymentMethod:
              normalizeString(
                validation?.card_type
              ),
          },
        }
      );

      return safeIPNResponse(
        "Payment validated but requires additional verification.",
        200
      );
    }

    /*
     * ========================================================
     * CONFIRM BOOKING
     * ========================================================
     */

    const paymentUpdate = {
      paymentStatus:
        "paid",

      status:
        "confirmed",

      paymentValidationId:
        valId,

      paymentBankTransactionId:
        normalizeString(
          validation?.bank_tran_id
        ),

      paymentCardType:
        normalizeString(
          validation?.card_type
        ),

      paymentMethod:
        normalizeString(
          validation?.card_type
        ),

      paymentPaidAt:
        new Date(),

      expiresAt:
        null,

      cancelledAt:
        null,

      cancellationReason:
        "",
    };

    console.log(
      "========== CONFIRMING BOOKING =========="
    );

    console.log({
      tranId,

      bookingGroupReference,

      bookingCount:
        bookings.length,

      expectedAmount,

      validatedAmount,

      validationStatus,
    });

    /*
     * Only pending bookings can become confirmed.
     */

    const updateResult =
      await Booking.updateMany(
        {
          paymentTransactionId:
            tranId,

          status:
            "pending",

          paymentStatus:
            "pending",

          expiresAt: {
            $gt: new Date(),
          },
        },
        {
          $set:
            paymentUpdate,
        }
      );

    console.log(
      "Booking update result:",
      {
        matched:
          updateResult.matchedCount,

        modified:
          updateResult.modifiedCount,

        acknowledged:
          updateResult.acknowledged,
      }
    );

    /*
     * ========================================================
     * VERIFY ALL BOOKINGS
     * ========================================================
     */

    if (
      updateResult.modifiedCount !==
      bookings.length
    ) {
      console.error(
        "Not all bookings were confirmed after payment validation:",
        {
          tranId,

          expected:
            bookings.length,

          modified:
            updateResult.modifiedCount,

          matched:
            updateResult.matchedCount,
        }
      );

      await cleanupExpiredBookings();

      const finalBookings =
        await Booking.find({
          paymentTransactionId:
            tranId,
        }).select(
          "status paymentStatus expiresAt"
        );

      console.log(
        "Final booking states:",
        finalBookings
      );

      const allConfirmed =
        finalBookings.length ===
          bookings.length &&
        finalBookings.every(
          (booking) =>
            booking.status ===
              "confirmed" &&
            booking.paymentStatus ===
              "paid"
        );

      if (!allConfirmed) {
        await BookingLock.deleteMany(
          {
            bookingGroupReference:
              bookingGroupReference,
          }
        );

        return safeIPNResponse(
          "Payment validated but booking confirmation requires retry.",
          503
        );
      }
    }

    /*
     * ========================================================
     * MAKE CONFIRMED LOCKS PERMANENT
     * ========================================================
     */

    const lockUpdateResult =
      await BookingLock.updateMany(
        {
          bookingGroupReference:
            bookingGroupReference,
        },
        {
          $set: {
            expiresAt:
              null,
          },
        }
      );

    console.log(
      "Booking locks made permanent:",
      {
        matched:
          lockUpdateResult.matchedCount,

        modified:
          lockUpdateResult.modifiedCount,
      }
    );

    /*
     * ========================================================
     * CREATE MEMBERSHIP
     * ========================================================
     */

    const confirmedBookings =
      await Booking.find({
        paymentTransactionId:
          tranId,

        status:
          "confirmed",

        paymentStatus:
          "paid",
      });

    console.log(
      "Confirmed paid bookings before membership provisioning:",
      {
        tranId,

        count:
          confirmedBookings.length,

        bookings:
          confirmedBookings.map(
            (booking) => ({
              bookingId:
                booking._id?.toString(),

              bookingReference:
                booking.bookingReference,

              facilityId:
                booking.facilityId?.toString(),

              serviceId:
                booking.serviceId?.toString(),

              serviceName:
                booking.serviceName,

              quantity:
                booking.quantity,

              priceAtBooking:
                booking.priceAtBooking,

              status:
                booking.status,

              paymentStatus:
                booking.paymentStatus,
            })
          ),
      }
    );

    let membershipResult;

    try {
      membershipResult =
        await createMembershipsForPaidBookings(
          confirmedBookings,
          tranId
        );

      console.log(
        "========== MEMBERSHIP PROVISIONING RESULT =========="
      );

      console.log({
        tranId,

        bookingGroupReference,

        created:
          membershipResult.created,

        existing:
          membershipResult.existing,
      });
    } catch (error) {
      /*
       * Payment and booking are already confirmed.
       *
       * Do NOT reverse the payment here.
       *
       * Returning 503 allows the IPN to be retried.
       */

      console.error(
        "Membership provisioning failed:",
        error
      );

      return safeIPNResponse(
        "Payment confirmed but membership provisioning requires retry.",
        503
      );
    }

    /*
     * ========================================================
     * FINAL CONFIRMATION
     * ========================================================
     */

    console.log(
      "========== SSL PAYMENT CONFIRMED =========="
    );

    console.log(
      "SSLCommerz payment confirmed:",
      {
        tranId,

        bookingGroupReference,

        bookingCount:
          confirmedBookings.length,

        amount:
          expectedAmount,

        validationStatus,

        membershipsCreated:
          membershipResult.created,

        membershipsAlreadyExisting:
          membershipResult.existing,
      }
    );

    return safeIPNResponse(
      "Payment validated, bookings confirmed, and memberships provisioned.",
      200
    );
  } catch (error) {
    console.error(
      "========== SSL IPN PROCESSING FAILED =========="
    );

    console.error(
      "SSLCommerz IPN processing failed:",
      error
    );

    /*
     * Returning an error allows SSLCommerz/retry mechanisms
     * to attempt the notification again.
     *
     * Never falsely mark a payment as failed here.
     */

    return safeIPNResponse(
      "IPN processing temporarily failed.",
      500
    );
  }
}