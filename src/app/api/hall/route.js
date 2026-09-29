import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Hall from "@/models/hall";

function generateSeats() {
  const seats = [];
  const rows = ["A", "B", "C", "D", "E"];

  rows.forEach((row) => {
    for (let number = 1; number <= 10; number++) {
      seats.push({
        seatNumber: `${row}${number}`,
        row,
        number,
      });
    }
  });

  return seats;
}

export async function GET() {
  try {
    await connectDB();

    let hall = await Hall.findOne({
      name: "Hall 1",
    });

    // Create Hall 1 if it doesn't exist
    if (!hall) {
      hall = await Hall.create({
        name: "Hall 1",
        capacity: 50,
        rows: 5,
        seatsPerRow: 10,
        seats: generateSeats(),
      });
    }

    // Generate seats if an old Hall exists without seats
    else if (!hall.seats || hall.seats.length === 0) {
      hall.seats = generateSeats();
      await hall.save();
    }

    return NextResponse.json({
      success: true,
      hall,
    });
  } catch (error) {
    console.error("GET hall error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch hall",
      },
      { status: 500 }
    );
  }
}