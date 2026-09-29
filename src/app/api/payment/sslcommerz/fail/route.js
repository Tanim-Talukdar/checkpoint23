
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const tranId = formData.get("tran_id");
    const movieId = formData.get("value_a");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl || !tranId || !movieId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment callback",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const booking = await Booking.findOne({
      "payment.tranId": String(tranId),
    });

    if (booking) {
      // Only change an unpaid pending booking
      if (
        booking.paymentStatus === "pending" &&
        booking.bookingStatus === "pending"
      ) {
        booking.paymentStatus = "failed";
        booking.bookingStatus = "cancelled";

        await booking.save();
      }
    }

    return NextResponse.redirect(
      `${baseUrl}/movie/${encodeURIComponent(
        String(movieId)
      )}/booking/failed?tranId=${encodeURIComponent(
        String(tranId)
      )}`
    );
  } catch (error) {
    console.error("SSLCOMMERZ fail callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment callback failed",
      },
      { status: 500 }
    );
  }
}
