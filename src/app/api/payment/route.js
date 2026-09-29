import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";

export const runtime = "nodejs";

const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

export async function POST(request) {
  try {
    // --------------------------------------------------
    // 1. Validate request body
    // --------------------------------------------------

    const body = await request.json();

    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking ID",
        },
        { status: 400 }
      );
    }

    const { bookingId } = parsed.data;

    // --------------------------------------------------
    // 2. Connect to MongoDB
    // --------------------------------------------------

    await connectDB();

    // --------------------------------------------------
    // 3. Find booking
    // --------------------------------------------------

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Check booking status
    // --------------------------------------------------

    if (
      booking.paymentStatus !== "pending" ||
      booking.bookingStatus !== "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking is not available for payment",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Check booking expiration
    // --------------------------------------------------

    if (
      !booking.expiresAt ||
      new Date(booking.expiresAt).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking has expired",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 6. Check environment variables
    // --------------------------------------------------

    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!storeId || !storePassword) {
      console.error("SSLCOMMERZ credentials are missing");

      return NextResponse.json(
        {
          success: false,
          message: "SSLCOMMERZ credentials are not configured",
        },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is missing");

      return NextResponse.json(
        {
          success: false,
          message: "NEXT_PUBLIC_BASE_URL is not configured",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 7. Generate unique transaction ID
    // --------------------------------------------------

    const tranId = `B${Date.now()}${Math.floor(
      Math.random() * 1000000
    )}`;

    // --------------------------------------------------
    // 8. Save transaction ID
    // --------------------------------------------------

    booking.payment = booking.payment || {};
    booking.payment.tranId = tranId;

    await booking.save();

    // --------------------------------------------------
    // 9. SSLCOMMERZ API data
    // --------------------------------------------------

    const paymentData = {
      store_id: storeId,
      store_passwd: storePassword,

      total_amount: String(booking.totalAmount),
      currency: "BDT",
      tran_id: tranId,

      // Movie ID
      value_a: booking.movieId.toString(),

      // Callback URLs
      success_url: `${baseUrl}/api/payment/sslcommerz/success`,
      fail_url: `${baseUrl}/api/payment/sslcommerz/fail`,
      cancel_url: `${baseUrl}/api/payment/sslcommerz/cancel`,
      ipn_url: `${baseUrl}/api/payment/sslcommerz/ipn`,

      // Shipping
      shipping_method: "NO",

      // Product
      product_name: "Movie Ticket",
      product_category: "Movie",
      product_profile: "non-physical-goods",

      // Customer
      cus_name: booking.customer.name,
      cus_email: booking.customer.email,
      cus_phone: booking.customer.phone,

      cus_add1: "N/A",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",

      // Shipping information
      ship_name: booking.customer.name,
      ship_add1: "N/A",
      ship_city: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
    };

    // --------------------------------------------------
    // 10. Select Sandbox / Live endpoint
    // --------------------------------------------------

    const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

    const sslcommerzUrl = isLive
      ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
      : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

    console.log("Initializing SSLCOMMERZ payment:", {
      tranId,
      amount: booking.totalAmount,
      mode: isLive ? "LIVE" : "SANDBOX",
      baseUrl,
    });

    // --------------------------------------------------
    // 11. Convert data to application/x-www-form-urlencoded
    // --------------------------------------------------

    const formData = new URLSearchParams();

    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // --------------------------------------------------
    // 12. Call SSLCOMMERZ directly
    // --------------------------------------------------

    const response = await fetch(sslcommerzUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: formData.toString(),
    });

    // --------------------------------------------------
    // 13. Check HTTP response
    // --------------------------------------------------

    if (!response.ok) {
      const errorText = await response.text();

      console.error("SSLCOMMERZ HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        response: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          message: "SSLCOMMERZ server request failed",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 14. Parse SSLCOMMERZ response
    // --------------------------------------------------

    const apiResponse = await response.json();

    console.log("SSLCOMMERZ response:", {
      status: apiResponse?.status,
      sessionkey: apiResponse?.sessionkey,
      GatewayPageURL: apiResponse?.GatewayPageURL,
    });

    // --------------------------------------------------
    // 15. Check gateway URL
    // --------------------------------------------------

    if (
      !apiResponse ||
      apiResponse.status !== "SUCCESS" ||
      !apiResponse.GatewayPageURL
    ) {
      console.error(
        "SSLCOMMERZ initialization failed:",
        apiResponse
      );

      return NextResponse.json(
        {
          success: false,
          message:
            apiResponse?.failedreason ||
            "Failed to initialize SSLCOMMERZ payment",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 16. Return payment URL
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      paymentUrl: apiResponse.GatewayPageURL,
    });
  } catch (error) {
    console.error("SSLCOMMERZ payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment initialization failed",
      },
      { status: 500 }
    );
  }
}