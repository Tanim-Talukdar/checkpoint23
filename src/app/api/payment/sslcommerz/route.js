import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import Booking from "@/models/booking";
import BookingLock from "@/models/bookingLock";
import Payment from "@/models/payment";
import Facility from "@/models/facility";
import Membership from "@/models/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_GATEWAY_URL =
  "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

const SANDBOX_GATEWAY_URL =
  "https://sandbox-gw.sslcommerz.com/gwprocess/v4/api.php";

const LIVE_VALIDATION_URL =
  "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

const SANDBOX_VALIDATION_URL =
  "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

const SUCCESS_STATUSES = ["VALID", "VALIDATED"];

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

function getGatewayURL() {
  return isSandbox()
    ? SANDBOX_GATEWAY_URL
    : LIVE_GATEWAY_URL;
}

function getValidationURL() {
  return isSandbox()
    ? SANDBOX_VALIDATION_URL
    : LIVE_VALIDATION_URL;
}

function parseAmount(value) {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : null;
}

function amountsMatch(expected, received) {
  const a = Number(expected);
  const b = Number(received);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return false;
  }

  return Math.abs(a - b) < 0.01;
}

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
    const formData = await request.formData();

    const data = {};

    for (const [key, value] of formData.entries()) {
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

function safeResponse(message, status = 200, extra = {}) {
  return NextResponse.json(
    {
      success: status >= 200 && status < 300,
      message,
      ...extra,
    },
    { status }
  );
}

// ------------------------------------------------------------
// PUBLIC BASE URL
// ------------------------------------------------------------

function getBaseURL(request) {
  const configuredURL =
    normalizeString(
      process.env.NEXT_PUBLIC_SITE_URL
    ) ||
    normalizeString(
      process.env.NEXT_PUBLIC_BASE_URL
    );

  if (configuredURL) {
    return configuredURL.replace(/\/+$/, "");
  }

  const forwardedHost = normalizeString(
    request.headers.get("x-forwarded-host")
  );

  const host =
    forwardedHost ||
    normalizeString(
      request.headers.get("host")
    );

  const forwardedProto = normalizeString(
    request.headers.get("x-forwarded-proto")
  );

  const protocol =
    forwardedProto.split(",")[0]?.trim() || "https";

  if (!host) {
    return null;
  }

  return `${protocol}://${host}`;
}

// ------------------------------------------------------------
// TRANSACTION ID
// ------------------------------------------------------------

function generateTransactionId() {
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase();

  const timePart = Date.now()
    .toString(36)
    .toUpperCase();

  return `CP${timePart}${randomPart}`.slice(0, 30);
}

// ------------------------------------------------------------
// MEMBERSHIP HELPERS
// ------------------------------------------------------------

function getMembershipDefinition(service) {
  const slug = normalizeString(
    service?.slug
  ).toLowerCase();

  if (slug === "gym-monthly") {
    return {
      membershipType: "gym",
      facilities: ["gym"],
    };
  }

  if (slug === "pool-monthly") {
    return {
      membershipType: "pool",
      facilities: ["pool"],
    };
  }

  if (slug === "gym-pool-monthly") {
    return {
      membershipType: "gym_pool",
      facilities: ["gym", "pool"],
    };
  }

  return null;
}

function addOneMonth(date) {
  const result = new Date(date);

  const originalDay = result.getDate();

  result.setMonth(result.getMonth() + 1);

  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }

  return result;
}

function getMembershipMonthPrefix(date) {
  const months = [
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

  return `${months[date.getMonth()]}-${date.getFullYear()}`;
}

async function generateMembershipCode(startDate) {
  const prefix =
    getMembershipMonthPrefix(startDate);

  const regex = new RegExp(
    `^${prefix}-\\d+$`,
    "i"
  );

  const latestMembership =
    await Membership.findOne({
      membershipCode: {
        $regex: regex,
      },
    })
      .sort({
        membershipCode: -1,
      })
      .select("membershipCode")
      .lean();

  let nextNumber = 1001;

  if (latestMembership?.membershipCode) {
    const match =
      latestMembership.membershipCode.match(
        /(\d+)$/
      );

    if (match) {
      nextNumber =
        Number(match[1]) + 1;
    }
  }

  return `${prefix}-${nextNumber}`;
}

// ------------------------------------------------------------
// MEMBERSHIP PROVISIONING
// ------------------------------------------------------------

async function createMembershipsForPaidBookings(
  bookings,
  transactionId
) {
  console.log(
    "========== MEMBERSHIP FUNCTION START =========="
  );

  console.log({
    transactionId,
    bookingCount: bookings.length,
  });

  const eligibleBookings =
    bookings.filter(
      (booking) =>
        booking.status === "confirmed" &&
        booking.paymentStatus === "paid"
    );

  console.log(
    "Eligible paid/confirmed bookings:",
    eligibleBookings.length
  );

  if (!eligibleBookings.length) {
    console.log(
      "No paid/confirmed bookings require membership provisioning."
    );

    return [];
  }

  const createdMemberships = [];

  for (const booking of eligibleBookings) {
    console.log(
      "---------- MEMBERSHIP BOOKING ----------"
    );

    console.log({
      bookingId: booking._id?.toString(),
      bookingReference:
        booking.bookingReference,
      bookingGroupReference:
        booking.bookingGroupReference,
      facilityId:
        booking.facilityId?.toString(),
      serviceId:
        booking.serviceId?.toString(),
      serviceName:
        booking.serviceName,
      customerEmail:
        booking.customerEmail,
      totalAmount:
        booking.totalAmount,
    });

    // --------------------------------------------------------
    // EXACT FACILITY LOOKUP
    // --------------------------------------------------------

    const facility =
      await Facility.findById(
        booking.facilityId
      )
        .select(
          "_id name slug services"
        )
        .lean();

    if (!facility) {
      throw new Error(
        `Facility not found for booking ${booking.bookingReference}.`
      );
    }

    console.log(
      "Exact facility found:",
      {
        facilityId:
          facility._id.toString(),
        name: facility.name,
        slug: facility.slug,
      }
    );

    // --------------------------------------------------------
    // EXACT SERVICE LOOKUP
    // --------------------------------------------------------

    const service =
      (facility.services || []).find(
        (item) =>
          String(item._id) ===
          String(booking.serviceId)
      );

    if (!service) {
      throw new Error(
        `Service ${booking.serviceId} not found inside facility ${facility._id} for booking ${booking.bookingReference}.`
      );
    }

    console.log(
      "Exact booked service found:",
      {
        serviceId:
          service._id?.toString(),
        name: service.name,
        slug: service.slug,
        type: service.type,
        pricingType:
          service.pricingType,
        price: service.price,
      }
    );

    // --------------------------------------------------------
    // MEMBERSHIP DETECTION
    // --------------------------------------------------------

    const membershipDefinition =
      getMembershipDefinition(service);

    console.log(
      "Membership service detection:",
      {
        slug: service.slug,
        isMembership:
          Boolean(
            membershipDefinition
          ),
        membershipDefinition,
      }
    );

    if (!membershipDefinition) {
      console.log(
        "Booking is not a monthly membership. Skipping."
      );

      continue;
    }

    // --------------------------------------------------------
    // QUANTITY
    // --------------------------------------------------------

    const quantity =
      Number(booking.quantity);

    if (quantity !== 1) {
      throw new Error(
        `Membership booking ${booking.bookingReference} must have quantity 1.`
      );
    }

    // --------------------------------------------------------
    // CUSTOMER DATA
    // --------------------------------------------------------

    const customerName =
      normalizeString(
        booking.customerName
      );

    const customerEmail =
      normalizeString(
        booking.customerEmail
      ).toLowerCase();

    const customerPhone =
      normalizeString(
        booking.customerPhone
      );

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone
    ) {
      throw new Error(
        `Customer information is incomplete for membership booking ${booking.bookingReference}.`
      );
    }

    // --------------------------------------------------------
    // DATES
    // --------------------------------------------------------

    const startDate =
      new Date(booking.bookingDate);

    if (
      Number.isNaN(
        startDate.getTime()
      )
    ) {
      throw new Error(
        `Invalid membership start date for booking ${booking.bookingReference}.`
      );
    }

    const expiryDate =
      addOneMonth(startDate);

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    const price =
      Number(booking.priceAtBooking);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        `Invalid membership price for booking ${booking.bookingReference}.`
      );
    }

    // --------------------------------------------------------
    // IDEMPOTENCY
    // --------------------------------------------------------

    const activationNote =
      `Activated via SSLCommerz transaction ${transactionId}`;

    const existingMembership =
      await Membership.findOne({
        customerEmail,
        membershipType:
          membershipDefinition.membershipType,
        startDate,
        expiryDate,
        notes: activationNote,
      }).lean();

    if (existingMembership) {
      console.log(
        "Membership already exists:",
        {
          membershipId:
            existingMembership._id?.toString(),
          membershipCode:
            existingMembership.membershipCode,
          transactionId,
        }
      );

      createdMemberships.push(
        existingMembership
      );

      continue;
    }

    // --------------------------------------------------------
    // MEMBERSHIP CODE
    // --------------------------------------------------------

    let membershipCode =
      await generateMembershipCode(
        startDate
      );

    // Extra uniqueness protection.
    for (let attempt = 0; attempt < 10; attempt++) {
      const codeExists =
        await Membership.exists({
          membershipCode,
        });

      if (!codeExists) {
        break;
      }

      membershipCode =
        `${getMembershipMonthPrefix(
          startDate
        )}-${1001 + attempt + 1}`;
    }

    console.log(
      "Generated membership code:",
      membershipCode
    );

    // --------------------------------------------------------
    // CREATE MEMBERSHIP
    // --------------------------------------------------------

    const membership =
      await Membership.create({
        membershipCode,

        customerName,

        customerEmail,

        customerPhone,

        membershipType:
          membershipDefinition.membershipType,

        facilities:
          membershipDefinition.facilities,

        price,

        startDate,

        expiryDate,

        active: true,

        dailyEntries: [],

        renewalHistory: [],

        lastRenewedAt: null,

        renewalCount: 0,

        notes: activationNote,
      });

    console.log(
      "========== MEMBERSHIP CREATED =========="
    );

    console.log({
      membershipId:
        membership._id.toString(),

      membershipCode:
        membership.membershipCode,

      customerEmail:
        membership.customerEmail,

      membershipType:
        membership.membershipType,

      facilities:
        membership.facilities,

      price:
        membership.price,

      startDate:
        membership.startDate,

      expiryDate:
        membership.expiryDate,

      transactionId,
    });

    createdMemberships.push(
      membership
    );
  }

  console.log(
    "========== MEMBERSHIP FUNCTION END =========="
  );

  console.log(
    "Memberships created/found:",
    createdMemberships.length
  );

  return createdMemberships;
}

// ------------------------------------------------------------
// PAYMENT INITIALIZATION
// ------------------------------------------------------------

async function initializePayment(
  request,
  data,
  credentials
) {
  const bookingGroupReference =
    normalizeString(
      data?.bookingGroupReference
    ).toUpperCase();

  if (!bookingGroupReference) {
    return safeResponse(
      "Booking group reference is required.",
      400
    );
  }

  if (
    bookingGroupReference.length > 100
  ) {
    return safeResponse(
      "Invalid booking group reference.",
      400
    );
  }

  const now = new Date();

  const bookings = await Booking.find({
    bookingGroupReference,
    status: "pending",
    paymentStatus: "pending",
  }).sort({
    createdAt: 1,
  });

  if (!bookings.length) {
    return safeResponse(
      "No pending booking was found for this booking group.",
      404
    );
  }

  const hasExpiredBooking =
    bookings.some(
      (booking) =>
        booking.expiresAt &&
        new Date(
          booking.expiresAt
        ).getTime() <= now.getTime()
    );

  if (hasExpiredBooking) {
    await BookingLock.deleteMany({
      bookingGroupReference,
    });

    return safeResponse(
      "The booking session has expired. Please create a new booking.",
      409,
      {
        code: "BOOKING_EXPIRED",
      }
    );
  }

  const invalidExpiry =
    bookings.some(
      (booking) =>
        !booking.expiresAt
    );

  if (invalidExpiry) {
    return safeResponse(
      "The booking payment session is invalid. Please create a new booking.",
      409,
      {
        code: "BOOKING_SESSION_INVALID",
      }
    );
  }

  const totalAmount =
    bookings.reduce(
      (total, booking) => {
        const amount =
          Number(
            booking.totalAmount
          );

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          return NaN;
        }

        return total + amount;
      },
      0
    );

  if (
    !Number.isFinite(totalAmount) ||
    totalAmount < 10
  ) {
    console.error(
      "Invalid booking amount:",
      {
        bookingGroupReference,
        totalAmount,
      }
    );

    return safeResponse(
      "Invalid booking payment amount.",
      500
    );
  }

  if (totalAmount > 500000) {
    return safeResponse(
      "Booking amount exceeds the payment gateway limit.",
      400
    );
  }

  const existingTransactionIds = [
    ...new Set(
      bookings
        .map((booking) =>
          normalizeString(
            booking.paymentTransactionId
          )
        )
        .filter(Boolean)
    ),
  ];

  let transactionId =
    existingTransactionIds.length === 1
      ? existingTransactionIds[0]
      : "";

  if (
    existingTransactionIds.length > 1
  ) {
    console.error(
      "Multiple transaction IDs found in one booking group:",
      {
        bookingGroupReference,
        transactionIds:
          existingTransactionIds,
      }
    );

    return safeResponse(
      "Invalid payment transaction state.",
      500
    );
  }

  if (!transactionId) {
    transactionId =
      generateTransactionId();

    const existingBooking =
      await Booking.findOne({
        paymentTransactionId:
          transactionId,
      }).select("_id");

    if (existingBooking) {
      transactionId =
        generateTransactionId();
    }
  }

  const customer = bookings[0];

  const customerName =
    normalizeString(
      customer.customerName
    );

  const customerEmail =
    normalizeString(
      customer.customerEmail
    );

  const customerPhone =
    normalizeString(
      customer.customerPhone
    );

  if (
    !customerName ||
    !customerEmail ||
    !customerPhone
  ) {
    return safeResponse(
      "Customer information is incomplete.",
      400
    );
  }

  const baseURL =
    getBaseURL(request);

  if (!baseURL) {
    console.error(
      "Unable to determine public application URL."
    );

    return safeResponse(
      "Payment callback URL is not configured.",
      500
    );
  }

  const successURL =
    `${baseURL}/api/payment/sslcommerz/success`;

  const failURL =
    `${baseURL}/api/payment/sslcommerz/fail`;

  const cancelURL =
    `${baseURL}/api/payment/sslcommerz/cancel`;

  const ipnURL =
    `${baseURL}/api/payment/sslcommerz`;

  const transactionUpdateResult =
    await Booking.updateMany(
      {
        bookingGroupReference,
        status: "pending",
        paymentStatus: "pending",
        expiresAt: {
          $gt: new Date(),
        },
      },
      {
        $set: {
          paymentTransactionId:
            transactionId,
          paymentInitiatedAt:
            new Date(),
        },
      }
    );

  if (
    transactionUpdateResult.matchedCount !==
    bookings.length
  ) {
    console.error(
      "Unable to assign transaction ID to all bookings:",
      {
        bookingGroupReference,
        expected:
          bookings.length,
        matched:
          transactionUpdateResult.matchedCount,
        modified:
          transactionUpdateResult.modifiedCount,
      }
    );

    return safeResponse(
      "Booking payment session could not be prepared. Please try again.",
      409
    );
  }

  const verifiedBookings =
    await Booking.find({
      bookingGroupReference,
      paymentTransactionId:
        transactionId,
      status: "pending",
      paymentStatus: "pending",
    });

  if (
    verifiedBookings.length !==
    bookings.length
  ) {
    return safeResponse(
      "Booking payment session could not be verified. Please try again.",
      409
    );
  }

  const verifiedExpired =
    verifiedBookings.some(
      (booking) =>
        !booking.expiresAt ||
        new Date(
          booking.expiresAt
        ).getTime() <= Date.now()
    );

  if (verifiedExpired) {
    await BookingLock.deleteMany({
      bookingGroupReference,
    });

    return safeResponse(
      "The booking session has expired. Please create a new booking.",
      409,
      {
        code: "BOOKING_EXPIRED",
      }
    );
  }

  try {
    await Payment.findOneAndUpdate(
      {
        transactionId,
      },
      {
        $set: {
          bookingGroupReference,

          bookingIds:
            verifiedBookings.map(
              (booking) =>
                booking._id
            ),

          customerName,

          customerEmail,

          customerPhone,

          amount:
            totalAmount,

          currency:
            "BDT",

          paymentMethod:
            "SSLCommerz",

          status:
            "pending",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    console.error(
      "Failed to create/update payment record:",
      error
    );

    return safeResponse(
      "Payment session could not be prepared.",
      500
    );
  }

  const gatewayURL =
    getGatewayURL();

  const formData =
    new URLSearchParams();

  formData.set(
    "store_id",
    credentials.storeId
  );

  formData.set(
    "store_passwd",
    credentials.storePassword
  );

  formData.set(
    "total_amount",
    totalAmount.toFixed(2)
  );

  formData.set(
    "currency",
    "BDT"
  );

  formData.set(
    "tran_id",
    transactionId
  );

  formData.set(
    "success_url",
    successURL
  );

  formData.set(
    "fail_url",
    failURL
  );

  formData.set(
    "cancel_url",
    cancelURL
  );

  formData.set(
    "ipn_url",
    ipnURL
  );

  formData.set(
    "cus_name",
    customerName
  );

  formData.set(
    "cus_email",
    customerEmail
  );

  formData.set(
    "cus_phone",
    customerPhone
  );

  formData.set(
    "cus_add1",
    "Bashundhara R/A"
  );

  formData.set(
    "cus_city",
    "Dhaka"
  );

  formData.set(
    "cus_state",
    "Dhaka"
  );

  formData.set(
    "cus_postcode",
    "1229"
  );

  formData.set(
    "cus_country",
    "Bangladesh"
  );

  formData.set(
    "shipping_method",
    "NO"
  );

  formData.set(
    "product_name",
    "Checkpoint Booking"
  );

  formData.set(
    "product_category",
    "Service"
  );

  formData.set(
    "product_profile",
    "general"
  );

  formData.set(
    "value_a",
    bookingGroupReference
  );

  console.log(
    "========== SSL PAYMENT INITIATION =========="
  );

  console.log({
    environment:
      isSandbox()
        ? "SANDBOX"
        : "LIVE",

    gatewayURL,

    bookingGroupReference,

    transactionId,

    totalAmount,

    bookingCount:
      verifiedBookings.length,
  });

  let gatewayResponse;

  try {
    gatewayResponse =
      await fetch(
        gatewayURL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            formData.toString(),

          cache: "no-store",

          signal:
            AbortSignal.timeout(
              30000
            ),
        }
      );
  } catch (error) {
    console.error(
      "SSLCommerz payment initiation request failed:",
      error
    );

    return safeResponse(
      "Payment gateway is temporarily unavailable. Please try again.",
      503
    );
  }

  console.log(
    "SSLCommerz initiation HTTP status:",
    gatewayResponse.status
  );

  let gatewayData;

  try {
    gatewayData =
      await gatewayResponse.json();
  } catch (error) {
    console.error(
      "SSLCommerz returned invalid initiation response:",
      error
    );

    return safeResponse(
      "Invalid response received from payment gateway.",
      502
    );
  }

  console.log(
    "SSLCommerz initiation response:",
    {
      status:
        gatewayData?.status,

      failedreason:
        gatewayData?.failedreason,

      hasGatewayPageURL:
        Boolean(
          gatewayData?.GatewayPageURL
        ),

      hasRedirectGatewayURL:
        Boolean(
          gatewayData?.redirectGatewayURL
        ),

      sessionkey:
        Boolean(
          gatewayData?.sessionkey
        ),
    }
  );

  const gatewayStatus =
    normalizeString(
      gatewayData?.status
    ).toUpperCase();

  if (
    !gatewayResponse.ok ||
    gatewayStatus !== "SUCCESS"
  ) {
    console.error(
      "SSLCommerz payment initiation failed:",
      {
        httpStatus:
          gatewayResponse.status,

        gatewayStatus,

        failedreason:
          gatewayData?.failedreason,
      }
    );

    return safeResponse(
      gatewayData?.failedreason ||
        "Unable to create payment session.",
      502
    );
  }

  const paymentUrl =
    normalizeString(
      gatewayData?.GatewayPageURL
    ) ||
    normalizeString(
      gatewayData?.redirectGatewayURL
    );

  if (!paymentUrl) {
    console.error(
      "SSLCommerz did not return a payment URL."
    );

    return safeResponse(
      "Payment gateway did not return a payment URL.",
      502
    );
  }

  try {
    const parsedURL =
      new URL(paymentUrl);

    if (
      parsedURL.protocol !==
      "https:"
    ) {
      throw new Error(
        "Payment URL is not HTTPS."
      );
    }
  } catch (error) {
    console.error(
      "Invalid SSLCommerz payment URL:",
      error
    );

    return safeResponse(
      "Payment gateway returned an invalid payment URL.",
      502
    );
  }

  return safeResponse(
    "Payment session created.",
    200,
    {
      paymentUrl,

      bookingGroupReference,

      transactionId,

      amount:
        totalAmount,
    }
  );
}

// ------------------------------------------------------------
// SSLCommerz IPN
// ------------------------------------------------------------

async function processIPN(
  request,
  data,
  credentials
) {
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

  const tranId =
    normalizeString(
      data?.tran_id
    );

  const valId =
    normalizeString(
      data?.val_id
    );

  const ipnStatus =
    normalizeString(
      data?.status
    ).toUpperCase();

  const ipnAmount =
    parseAmount(
      data?.amount
    );

  const ipnCurrency =
    normalizeString(
      data?.currency
    ).toUpperCase();

  const ipnGroupReference =
    normalizeString(
      data?.value_a
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

    return safeResponse(
      "Missing transaction ID.",
      400
    );
  }

  // ----------------------------------------------------------
  // FIND BOOKINGS
  // ----------------------------------------------------------

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

    const payment =
      await Payment.findOne({
        transactionId:
          tranId,
      }).select(
        "_id status bookingGroupReference"
      );

    if (payment) {
      console.warn(
        "Payment record exists but Booking no longer exists:",
        {
          tranId,
          status:
            payment.status,
        }
      );

      return safeResponse(
        "Booking session has expired and no longer exists.",
        409
      );
    }

    return safeResponse(
      "Transaction not found.",
      404
    );
  }

  // ----------------------------------------------------------
  // GROUP CONSISTENCY
  // ----------------------------------------------------------

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

    return safeResponse(
      "Invalid booking group.",
      500
    );
  }

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

    return safeResponse(
      "Booking group mismatch.",
      400
    );
  }

  // ----------------------------------------------------------
  // ALREADY PAID
  // ----------------------------------------------------------

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
        bookingGroupReference,
      },
      {
        $set: {
          expiresAt: null,
        },
      }
    );

    await Payment.updateOne(
      {
        transactionId:
          tranId,
      },
      {
        $set: {
          status:
            "paid",

          gatewayTransactionId:
            tranId,

          ...(valId
            ? {
                gatewayValidationId:
                  valId,
              }
            : {}),

          paidAt:
            new Date(),
        },
      }
    );

    // IMPORTANT:
    // Even when payment was already processed,
    // retry membership provisioning.
    try {
      await createMembershipsForPaidBookings(
        bookings,
        tranId
      );
    } catch (error) {
      console.error(
        "Membership provisioning failed during already-paid retry:",
        error
      );

      return safeResponse(
        "Payment already processed, but membership provisioning requires retry.",
        503
      );
    }

    return safeResponse(
      "Payment already processed and membership provisioning completed.",
      200
    );
  }

  // ----------------------------------------------------------
  // NON-SUCCESS IPN
  // ----------------------------------------------------------

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
      ipnStatus === "FAILED" ||
      ipnStatus === "CANCELLED" ||
      ipnStatus === "CANCELED"
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
          bookingGroupReference,
        }
      );

      await Payment.updateOne(
        {
          transactionId:
            tranId,
        },
        {
          $set: {
            status:
              ipnStatus ===
              "FAILED"
                ? "failed"
                : "cancelled",

            gatewayTransactionId:
              tranId,
          },
        }
      );
    }

    return safeResponse(
      `Payment status received: ${
        ipnStatus || "UNKNOWN"
      }.`,
      200
    );
  }

  // ----------------------------------------------------------
  // SUCCESS IPN REQUIRES val_id
  // ----------------------------------------------------------

  if (!valId) {
    console.error(
      "Successful SSLCommerz IPN has no val_id:",
      tranId
    );

    return safeResponse(
      "Validation ID is missing.",
      400
    );
  }

  // ----------------------------------------------------------
  // SSLCommerz VALIDATION
  // ----------------------------------------------------------

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

          cache: "no-store",

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

    return safeResponse(
      "Payment validation service temporarily unavailable.",
      503
    );
  }

  console.log(
    "SSLCommerz validation HTTP status:",
    validationResponse.status
  );

  if (!validationResponse.ok) {
    return safeResponse(
      "Payment validation failed temporarily.",
      503
    );
  }

  let validation;

  try {
    validation =
      await validationResponse.json();

    console.log(
      "SSLCommerz validation status:",
      validation?.status
    );
  } catch {
    console.error(
      "SSLCommerz validation returned invalid JSON."
    );

    return safeResponse(
      "Invalid payment validation response.",
      502
    );
  }

  // ----------------------------------------------------------
  // VALIDATION STATUS
  // ----------------------------------------------------------

  const validationStatus =
    normalizeString(
      validation?.status
    ).toUpperCase();

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

    return safeResponse(
      "Payment could not be validated.",
      400
    );
  }

  // ----------------------------------------------------------
  // TRANSACTION ID VALIDATION
  // ----------------------------------------------------------

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

    return safeResponse(
      "Transaction validation mismatch.",
      400
    );
  }

  // ----------------------------------------------------------
  // CURRENCY VALIDATION
  // ----------------------------------------------------------

  const validatedCurrency =
    normalizeString(
      validation?.currency
    ).toUpperCase();

  if (
    validatedCurrency !==
    "BDT"
  ) {
    return safeResponse(
      "Invalid payment currency.",
      400
    );
  }

  if (
    ipnCurrency &&
    ipnCurrency !==
      "BDT"
  ) {
    return safeResponse(
      "Invalid IPN currency.",
      400
    );
  }

  // ----------------------------------------------------------
  // DATABASE AMOUNT
  // ----------------------------------------------------------

  const expectedAmount =
    bookings.reduce(
      (total, booking) => {
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

        return total + amount;
      },
      0
    );

  if (
    !Number.isFinite(
      expectedAmount
    ) ||
    expectedAmount <= 0
  ) {
    return safeResponse(
      "Invalid booking payment amount.",
      500
    );
  }

  // ----------------------------------------------------------
  // GATEWAY AMOUNT
  // ----------------------------------------------------------

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
    validatedAmount === null ||
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
        validatedAmount,
        ipnAmount,
      }
    );

    return safeResponse(
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
    return safeResponse(
      "IPN payment amount mismatch.",
      400
    );
  }

  // ----------------------------------------------------------
  // EXPIRY CHECK
  // ----------------------------------------------------------

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
    console.warn(
      "Validated payment arrived after booking expiry:",
      {
        tranId,
        bookingGroupReference,
      }
    );

    await BookingLock.deleteMany(
      {
        bookingGroupReference,
      }
    );

    await Payment.updateOne(
      {
        transactionId:
          tranId,
      },
      {
        $set: {
          status:
            "failed",

          gatewayTransactionId:
            tranId,

          gatewayValidationId:
            valId,
        },
      }
    );

    return safeResponse(
      "Payment was validated after the booking session expired. The booking was not confirmed.",
      409
    );
  }

  // ----------------------------------------------------------
  // RISK LEVEL
  // ----------------------------------------------------------

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

        status:
          "pending",

        expiresAt: {
          $gt: new Date(),
        },
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

    await Payment.updateOne(
      {
        transactionId:
          tranId,
      },
      {
        $set: {
          gatewayTransactionId:
            tranId,

          gatewayValidationId:
            valId,

          status:
            "pending",
        },
      }
    );

    return safeResponse(
      "Payment validated but requires additional verification.",
      200
    );
  }

  // ----------------------------------------------------------
  // CONFIRM PAYMENT
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // VERIFY EVERY BOOKING WAS CONFIRMED
  // ----------------------------------------------------------

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

    await BookingLock.deleteMany(
      {
        bookingGroupReference,
      }
    );

    await Payment.updateOne(
      {
        transactionId:
          tranId,
      },
      {
        $set: {
          gatewayTransactionId:
            tranId,

          gatewayValidationId:
            valId,

          status:
            "paid",

          paidAt:
            new Date(),
        },
      }
    );

    return safeResponse(
      "Payment validated but booking confirmation requires retry.",
      503
    );
  }

  // ----------------------------------------------------------
  // MAKE LOCKS PERMANENT
  // ----------------------------------------------------------

  const lockUpdateResult =
    await BookingLock.updateMany(
      {
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

  // ----------------------------------------------------------
  // PAYMENT AUDIT
  // ----------------------------------------------------------

  await Payment.updateOne(
    {
      transactionId:
        tranId,
    },
    {
      $set: {
        bookingGroupReference,

        bookingIds:
          bookings.map(
            (booking) =>
              booking._id
          ),

        customerName:
          normalizeString(
            bookings[0]
              .customerName
          ),

        customerEmail:
          normalizeString(
            bookings[0]
              .customerEmail
          ),

        customerPhone:
          normalizeString(
            bookings[0]
              .customerPhone
          ),

        amount:
          expectedAmount,

        currency:
          "BDT",

        paymentMethod:
          normalizeString(
            validation?.card_type
          ) ||
          "SSLCommerz",

        gatewayTransactionId:
          tranId,

        gatewayValidationId:
          valId,

        status:
          "paid",

        paidAt:
          new Date(),
      },
    }
  );

  // ----------------------------------------------------------
  // MEMBERSHIP PROVISIONING
  // ----------------------------------------------------------

  console.log(
    "========== STARTING MEMBERSHIP PROVISIONING =========="
  );

  // Re-fetch from MongoDB after the payment update.
  // This guarantees we use the newly confirmed state.
  const confirmedBookings =
    await Booking.find({
      paymentTransactionId:
        tranId,

      status:
        "confirmed",

      paymentStatus:
        "paid",
    }).lean();

  console.log(
    "Confirmed paid bookings for membership provisioning:",
    confirmedBookings.length
  );

  if (
    confirmedBookings.length !==
    bookings.length
  ) {
    console.error(
      "Confirmed booking count does not match original booking count:",
      {
        tranId,

        original:
          bookings.length,

        confirmed:
          confirmedBookings.length,
      }
    );

    return safeResponse(
      "Payment confirmed but membership provisioning requires retry.",
      503
    );
  }

  try {
    await createMembershipsForPaidBookings(
      confirmedBookings,
      tranId
    );
  } catch (error) {
    console.error(
      "========== MEMBERSHIP PROVISIONING FAILED =========="
    );

    console.error(
      "Membership provisioning failed:",
      error
    );

    // IMPORTANT:
    // Payment remains paid and booking remains confirmed.
    // Returning 503 allows the gateway/retry mechanism to
    // invoke this route again. The provisioning function is
    // idempotent, so it will not create duplicate memberships.

    return safeResponse(
      "Payment confirmed but membership provisioning requires retry.",
      503
    );
  }

  console.log(
    "========== MEMBERSHIP PROVISIONING COMPLETE =========="
  );

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  console.log(
    "========== SSL PAYMENT CONFIRMED =========="
  );

  console.log(
    "SSLCommerz payment confirmed:",
    {
      tranId,

      bookingGroupReference,

      bookingCount:
        bookings.length,

      amount:
        expectedAmount,

      validationStatus,
    }
  );

  return safeResponse(
    "Payment validated, bookings confirmed, and memberships provisioned.",
    200
  );
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

export async function POST(request) {
  try {
    await connectDB();

    const credentials =
      getSSLCredentials();

    if (!credentials) {
      console.error(
        "SSLCommerz credentials are not configured."
      );

      return safeResponse(
        "Payment gateway is not configured.",
        500
      );
    }

    const data =
      await readRequestData(
        request
      );

    const bookingGroupReference =
      normalizeString(
        data?.bookingGroupReference
      );

    const tranId =
      normalizeString(
        data?.tran_id
      );

    // --------------------------------------------------------
    // PAYMENT INITIALIZATION
    // --------------------------------------------------------

    if (
      bookingGroupReference &&
      !tranId
    ) {
      console.log(
        "========== PAYMENT INITIALIZATION REQUEST =========="
      );

      console.log({
        bookingGroupReference:
          bookingGroupReference.toUpperCase(),
      });

      return await initializePayment(
        request,
        data,
        credentials
      );
    }

    // --------------------------------------------------------
    // SSLCommerz IPN
    // --------------------------------------------------------

    console.log(
      "========== SSLCommerz IPN REQUEST =========="
    );

    return await processIPN(
      request,
      data,
      credentials
    );
  } catch (error) {
    console.error(
      "========== SSL PAYMENT/IPN PROCESSING FAILED =========="
    );

    console.error(
      "SSLCommerz processing failed:",
      error
    );

    return safeResponse(
      "Payment processing temporarily failed.",
      500
    );
  }
}