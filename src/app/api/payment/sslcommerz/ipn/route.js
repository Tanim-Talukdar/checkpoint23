import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    console.log("🔥 IPN ROUTE HIT");
    const formData = await request.formData();

    const tranId = formData.get("tran_id");
    const valId = formData.get("val_id");

    if (!tranId || !valId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment data",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const booking = await Booking.findOne({
      "payment.tranId": String(tranId),
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Already successfully processed
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment already confirmed",
      });
    }

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

    if (!storeId || !storePassword) {
      console.error("SSLCOMMERZ credentials are missing");

      return NextResponse.json(
        {
          success: false,
          message: "Payment configuration error",
        },
        { status: 500 }
      );
    }

    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const validationUrl = isLive
      ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

    const params = new URLSearchParams();

    params.append("val_id", String(valId));
    params.append("store_id", storeId);
    params.append("store_passwd", storePassword);
    params.append("v", "1");
    params.append("format", "json");

    const response = await fetch(
      `${validationUrl}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "SSLCOMMERZ validation HTTP error:",
        response.status
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment validation service unavailable",
        },
        { status: 502 }
      );
    }

    const validation = await response.json();

    // Don't log the complete validation response.
    console.log("SSLCOMMERZ validation:", {
      status: validation?.status,
      tranId: validation?.tran_id,
    });

    const valid =
      validation?.status === "VALID" ||
      validation?.status === "VALIDATED";

    // IMPORTANT:
    // Do NOT mark the booking failed here.
    // Anyone can potentially send a request to this public endpoint.
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment validation failed",
        },
        { status: 400 }
      );
    }

    // Verify transaction ID
    if (String(validation.tran_id) !== String(tranId)) {
      console.error("Transaction ID mismatch");

      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed",
        },
        { status: 400 }
      );
    }

    // Verify amount
    if (
      Number(validation.amount) !==
      Number(booking.totalAmount)
    ) {
      console.error("Payment amount mismatch");

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount mismatch",
        },
        { status: 400 }
      );
    }

    // Verify currency
    if (
      String(validation.currency).toUpperCase() !== "BDT"
    ) {
      console.error("Payment currency mismatch");

      return NextResponse.json(
        {
          success: false,
          message: "Payment currency mismatch",
        },
        { status: 400 }
      );
    }

    // Save verified payment information
    booking.payment = booking.payment || {};

    booking.payment.valId = String(valId);
    booking.payment.bankTranId =
      validation.bank_tran_id || "";
    booking.payment.cardType =
      validation.card_type || "";
    booking.payment.paymentMethod =
      validation.card_type || "";

    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";

    await booking.save();

    console.log("Payment confirmed:", {
      bookingId: booking._id.toString(),
      tranId: String(tranId),
    });

    return NextResponse.json({
      success: true,
      message: "Payment confirmed",
    });
  } catch (error) {
    console.error("SSLCOMMERZ IPN error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed",
      },
      { status: 500 }
    );
  }
}