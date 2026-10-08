
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// src/scripts -> src -> project root
const projectRoot = path.resolve(__dirname, "../..");

const envPath = path.join(
  projectRoot,
  ".env.local"
);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `.env.local was not found at:\n${filePath}`
    );
  }

  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#")
    ) {
      continue;
    }

    const equalIndex =
      trimmed.indexOf("=");

    if (equalIndex === -1) {
      continue;
    }

    const key =
      trimmed
        .slice(0, equalIndex)
        .trim();

    let value =
      trimmed
        .slice(equalIndex + 1)
        .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getMongoURI() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL
  );
}

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  return new Date(date).toISOString();
}

async function main() {
  let connected = false;

  try {
    console.log(
      "=========================================="
    );

    console.log(
      "CHECKPOINT EXPIRED BOOKING CHECK"
    );

    console.log(
      "READ-ONLY — NO DATA WILL BE CHANGED"
    );

    console.log(
      "=========================================="
    );

    loadEnvFile(envPath);

    const mongoURI =
      getMongoURI();

    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string was not found in .env.local."
      );
    }

    console.log(
      "\nConnecting to MongoDB..."
    );

    await mongoose.connect(
      mongoURI
    );

    connected = true;

    console.log(
      "✅ Connected."
    );

    const db =
      mongoose.connection.db;

    const now = new Date();

    console.log(
      `\nCurrent database time check: ${formatDate(now)}`
    );

    /*
     * ------------------------------------------------
     * CHECK EXPIRED PENDING BOOKINGS
     * ------------------------------------------------
     */

    const expiredBookings =
      await db
        .collection("bookings")
        .find({
          status: "pending",
          paymentStatus: {
            $in: [
              "unpaid",
              "pending",
            ],
          },
          expiresAt: {
            $ne: null,
            $lte: now,
          },
        })
        .project({
          _id: 1,
          bookingReference: 1,
          bookingGroupReference: 1,
          paymentTransactionId: 1,
          status: 1,
          paymentStatus: 1,
          expiresAt: 1,
          createdAt: 1,
          facilityName: 1,
          serviceName: 1,
          totalAmount: 1,
        })
        .sort({
          expiresAt: 1,
        })
        .toArray();

    /*
     * ------------------------------------------------
     * CHECK EXPIRED BOOKING LOCKS
     * ------------------------------------------------
     */

    const expiredLocks =
      await db
        .collection("bookinglocks")
        .find({
          expiresAt: {
            $ne: null,
            $lte: now,
          },
        })
        .project({
          _id: 1,
          bookingGroupReference: 1,
          bookingId: 1,
          facilityId: 1,
          serviceId: 1,
          bookingDate: 1,
          resourceKey: 1,
          timeSlice: 1,
          unit: 1,
          expiresAt: 1,
        })
        .sort({
          expiresAt: 1,
        })
        .toArray();

    /*
     * ------------------------------------------------
     * RESULTS
     * ------------------------------------------------
     */

    console.log(
      "\n=========================================="
    );

    console.log(
      "RESULT"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `\nExpired pending bookings still present: ${expiredBookings.length}`
    );

    if (expiredBookings.length > 0) {
      console.log(
        "\n⚠️ EXPIRED PENDING BOOKINGS FOUND:"
      );

      for (const booking of expiredBookings) {
        console.log(
          "\n------------------------------------------"
        );

        console.log(
          `Booking ID: ${booking._id}`
        );

        console.log(
          `Booking Reference: ${
            booking.bookingReference || "N/A"
          }`
        );

        console.log(
          `Group Reference: ${
            booking.bookingGroupReference || "N/A"
          }`
        );

        console.log(
          `Transaction ID: ${
            booking.paymentTransactionId || "N/A"
          }`
        );

        console.log(
          `Status: ${booking.status}`
        );

        console.log(
          `Payment Status: ${booking.paymentStatus}`
        );

        console.log(
          `Facility: ${
            booking.facilityName || "N/A"
          }`
        );

        console.log(
          `Service: ${
            booking.serviceName || "N/A"
          }`
        );

        console.log(
          `Amount: ${
            booking.totalAmount ?? "N/A"
          }`
        );

        console.log(
          `Created: ${formatDate(
            booking.createdAt
          )}`
        );

        console.log(
          `Expires: ${formatDate(
            booking.expiresAt
          )}`
        );
      }
    } else {
      console.log(
        "✅ No expired pending bookings found."
      );
    }

    console.log(
      `\nExpired booking locks still present: ${expiredLocks.length}`
    );

    if (expiredLocks.length > 0) {
      console.log(
        "\n⚠️ EXPIRED BOOKING LOCKS FOUND:"
      );

      for (const lock of expiredLocks) {
        console.log(
          "\n------------------------------------------"
        );

        console.log(
          `Lock ID: ${lock._id}`
        );

        console.log(
          `Group Reference: ${
            lock.bookingGroupReference || "N/A"
          }`
        );

        console.log(
          `Booking ID: ${
            lock.bookingId || "N/A"
          }`
        );

        console.log(
          `Resource: ${
            lock.resourceKey || "N/A"
          }`
        );

        console.log(
          `Time Slice: ${
            lock.timeSlice || "N/A"
          }`
        );

        console.log(
          `Unit: ${
            lock.unit ?? "N/A"
          }`
        );

        console.log(
          `Booking Date: ${formatDate(
            lock.bookingDate
          )}`
        );

        console.log(
          `Expires: ${formatDate(
            lock.expiresAt
          )}`
        );
      }
    } else {
      console.log(
        "✅ No expired booking locks found."
      );
    }

    /*
     * ------------------------------------------------
     * FINAL STATUS
     * ------------------------------------------------
     */

    console.log(
      "\n=========================================="
    );

    if (
      expiredBookings.length === 0 &&
      expiredLocks.length === 0
    ) {
      console.log(
        "✅ CLEAN"
      );

      console.log(
        "No expired pending bookings or expired"
      );

      console.log(
        "booking locks are currently present."
      );
    } else {
      console.log(
        "⚠️ EXPIRED RECORDS STILL PRESENT"
      );

      console.log(
        "This may simply mean MongoDB's TTL monitor"
      );

      console.log(
        "has not processed them yet."
      );
    }

    console.log(
      "=========================================="
    );

    console.log(
      "\nREAD-ONLY CHECK COMPLETE."
    );

    console.log(
      "No documents were modified."
    );
  } catch (error) {
    console.error(
      "\n❌ CHECK FAILED"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.connection.close();

      console.log(
        "\nMongoDB connection closed."
      );
    }
  }
}

main();
