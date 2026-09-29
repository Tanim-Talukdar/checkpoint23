import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/booking";
import ManualBooking from "@/models/ManualBooking";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

function normalizeOnlineBooking(booking) {
return {
...booking,
recordType: "Online",
bookingType: booking.bookingType || "seat",


customerName: booking.customer?.name || "",
email: booking.customer?.email || "",
phone: booking.customer?.phone || "",

movieName:
  booking.movieSnapshot?.title ||
  booking.movieId?.title ||
  booking.manualMovieName ||
  "",

date:
  booking.showtimeSnapshot?.date ||
  booking.showtimeId?.date ||
  booking.date ||
  "",

time:
  booking.showtimeSnapshot?.startTime ||
  booking.showtimeId?.startTime ||
  booking.time ||
  "",

hallName:
  booking.hallId?.name ||
  booking.hallName ||
  "",

seats: Array.isArray(booking.seats)
  ? booking.seats.join(", ")
  : "",

amount: Number(booking.totalAmount || 0),

paymentMethod:
  booking.payment?.paymentMethod || "Online",

paymentStatus:
  booking.paymentStatus || "pending",

bookingStatus:
  booking.bookingStatus || "pending",

transactionId:
  booking.payment?.tranId || "",

bankTransactionId:
  booking.payment?.bankTranId || "",

validationId:
  booking.payment?.valId || "",

notes: booking.notes || "",


};
}

function normalizeManualBooking(booking) {
return {
...booking,
recordType: "Manual",


bookingType:
  booking.bookingType || "seat",

customerName:
  booking.customerName || "",

email:
  booking.email || "",

phone:
  booking.phone || "",

movieName:
  booking.manualMovieName ||
  booking.movieSnapshot?.title ||
  "",

date:
  booking.showtimeSnapshot?.date ||
  booking.date ||
  "",

time:
  booking.showtimeSnapshot?.startTime ||
  booking.time ||
  "",

hallName:
  booking.hallName || "",

seats:
  booking.bookingType === "full-hall"
    ? "Full Hall"
    : Array.isArray(booking.seats)
    ? booking.seats.join(", ")
    : "",

amount: Number(
  booking.totalAmount ??
    booking.amount ??
    0
),

paymentMethod:
  booking.paymentMethod || "Cash",

paymentStatus:
  booking.bookingStatus === "cancelled"
    ? "cancelled"
    : "paid",

bookingStatus:
  booking.bookingStatus || "confirmed",

transactionId: "",
bankTransactionId: "",
validationId: "",

notes: booking.notes || "",


};
}

function matchesSearch(record, search) {
if (!search) return true;

const target = search.toLowerCase();

const values = [
record.bookingId,
record.customerName,
record.email,
record.phone,
record.movieName,
record.hallName,
record.transactionId,
record.bankTransactionId,
record.validationId,
record.recordType,
record.bookingType,
];

return values.some((value) =>
String(value || "")
.toLowerCase()
.includes(target)
);
}

export async function GET(request) {
try {
const auth = await requireAdmin();


if (!auth.authenticated) {
  return NextResponse.json(
    {
      success: false,
      message: "Unauthorized",
    },
    { status: 401 }
  );
}

await connectDB();

const { searchParams } =
  new URL(request.url);

const search =
  searchParams.get("search")?.trim() || "";

const paymentStatus =
  searchParams.get("paymentStatus") || "all";

const bookingStatus =
  searchParams.get("bookingStatus") || "all";

const [onlineBookings, manualBookings] =
  await Promise.all([
    Booking.find({})
      .populate(
        "movieId",
        "title poster backdrop duration rating"
      )
      .populate(
        "showtimeId",
        "date startTime ticketPrice"
      )
      .populate(
        "hallId",
        "name capacity rows seatsPerRow seats"
      )
      .lean(),

    ManualBooking.find({})
      .lean(),
  ]);

let records = [
  ...onlineBookings.map(
    normalizeOnlineBooking
  ),
  ...manualBookings.map(
    normalizeManualBooking
  ),
];

records = records.filter((record) => {
  if (
    paymentStatus !== "all" &&
    record.paymentStatus !== paymentStatus
  ) {
    return false;
  }

  if (
    bookingStatus !== "all" &&
    record.bookingStatus !== bookingStatus
  ) {
    return false;
  }

  if (!matchesSearch(record, search)) {
    return false;
  }

  return true;
});

records.sort(
  (a, b) =>
    new Date(b.createdAt || 0) -
    new Date(a.createdAt || 0)
);

const rows = records.map((record) => ({
  "Booking ID":
    record.bookingId ||
    record._id?.toString() ||
    "",

  Type: record.recordType,

  "Booking Type":
    record.bookingType === "full-hall"
      ? "Full Hall"
      : "Seat",

  "Customer Name":
    record.customerName || "",

  Email:
    record.email || "",

  Phone:
    record.phone || "",

  Movie:
    record.movieName || "",

  Date:
    record.date || "",

  Time:
    record.time || "",

  Hall:
    record.hallName || "",

  Seats:
    record.seats || "",

  Amount:
    record.amount || 0,

  "Payment Method":
    record.paymentMethod || "",

  "Payment Status":
    record.paymentStatus || "",

  "Booking Status":
    record.bookingStatus || "",

  "Transaction ID":
    record.transactionId || "",

  "Bank Transaction ID":
    record.bankTransactionId || "",

  "Validation ID":
    record.validationId || "",

  Notes:
    record.notes || "",

  "Created At":
    record.createdAt
      ? new Date(record.createdAt)
      : "",

  "Updated At":
    record.updatedAt
      ? new Date(record.updatedAt)
      : "",
}));

const worksheet =
  XLSX.utils.json_to_sheet(rows);

worksheet["!cols"] = [
  { wch: 24 },
  { wch: 12 },
  { wch: 15 },
  { wch: 22 },
  { wch: 28 },
  { wch: 18 },
  { wch: 30 },
  { wch: 14 },
  { wch: 14 },
  { wch: 15 },
  { wch: 25 },
  { wch: 14 },
  { wch: 18 },
  { wch: 16 },
  { wch: 18 },
  { wch: 25 },
  { wch: 25 },
  { wch: 25 },
  { wch: 35 },
  { wch: 24 },
  { wch: 24 },
];

const workbook =
  XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
  workbook,
  worksheet,
  "Payments"
);

const buffer =
  XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

return new NextResponse(buffer, {
  status: 200,
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "Content-Disposition":
      `attachment; filename="checkpoint-payments-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,

    "Cache-Control":
      "no-store, max-age=0",
  },
});


} catch (error) {
console.error(
"GET payment export error:",
error
);


return NextResponse.json(
  {
    success: false,
    message:
      "Failed to export payments",
  },
  { status: 500 }
);


}
}
