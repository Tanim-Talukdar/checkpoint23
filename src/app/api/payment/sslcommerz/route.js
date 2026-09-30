import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";

export const runtime = "nodejs";

const paymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});

const getSslCommerzUrl = () =>
  process.env.SSLCOMMERZ_IS_LIVE === "true"
    ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

export async function POST(request) {
  try {
    // Validate request
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const { bookingId } = validation.data;

    if (!mongoose.isValidObjectId(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Validate booking state
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

    if (
      !booking.expiresAt ||
      new Date(booking.expiresAt).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { success: false, message: "Booking has expired" },
        { status: 400 }
      );
    }

    // Environment
    const {
      SSLCOMMERZ_STORE_ID: storeId,
      SSLCOMMERZ_STORE_PASSWORD: storePassword,
      NEXT_PUBLIC_BASE_URL: baseUrl,
    } = process.env;

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

    // Reuse existing transaction ID
    const tranId =
      booking.payment?.tranId ||
      `B${Date.now()}${Math.floor(Math.random() * 1000000)}`;

    if (booking.payment?.tranId !== tranId) {
      booking.payment = {
        ...(booking.payment || {}),
        tranId,
      };

      await booking.save();
    }

    const paymentData = {
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: String(booking.totalAmount),
      currency: "BDT",
      tran_id: tranId,

      value_a: booking.movieId.toString(),

      success_url: `${baseUrl}/api/payment/sslcommerz/success`,
      fail_url: `${baseUrl}/api/payment/sslcommerz/fail`,
      cancel_url: `${baseUrl}/api/payment/sslcommerz/cancel`,
      ipn_url: `${baseUrl}/api/payment/sslcommerz/ipn`,

      shipping_method: "NO",

      product_name: "Movie Ticket",
      product_category: "Movie",
      product_profile: "non-physical-goods",

      cus_name: booking.customer.name,
      cus_email: booking.customer.email,
      cus_phone: booking.customer.phone,

      cus_add1: "N/A",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",

      ship_name: booking.customer.name,
      ship_add1: "N/A",
      ship_city: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
    };

    const formData = new URLSearchParams();

    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Initialize SSLCOMMERZ
    const response = await fetch(getSslCommerzUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("SSLCOMMERZ HTTP error:", {
        status: response.status,
        statusText: response.statusText,
      });

      return NextResponse.json(
        {
          success: false,
          message: "SSLCOMMERZ server request failed",
        },
        { status: 502 }
      );
    }

    let apiResponse;

    try {
      apiResponse = JSON.parse(responseText);
    } catch {
      console.error("Invalid SSLCOMMERZ response:", {
        status: response.status,
        contentType: response.headers.get("content-type"),
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from SSLCOMMERZ",
        },
        { status: 502 }
      );
    }

    if (
      apiResponse?.status !== "SUCCESS" ||
      !apiResponse?.GatewayPageURL
    ) {
      console.error("SSLCOMMERZ initialization failed:", {
        status: apiResponse?.status,
        failedreason: apiResponse?.failedreason,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            apiResponse?.failedreason ||
            "Failed to initialize SSLCOMMERZ payment",
        },
        { status: 502 }
      );
    }

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