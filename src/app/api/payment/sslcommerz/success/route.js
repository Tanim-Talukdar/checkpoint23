import { NextResponse } from "next/server";

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

    return NextResponse.redirect(
      `${baseUrl}/movie/${encodeURIComponent(
        String(movieId)
      )}/booking/success?tranId=${encodeURIComponent(
        String(tranId)
      )}`
    );
  } catch (error) {
    console.error("SSLCOMMERZ success callback error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment callback failed",
      },
      { status: 500 }
    );
  }
}