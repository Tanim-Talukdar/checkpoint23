
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const possibleFiles = [
    path.join(__dirname, "../../.env.local"),
    path.join(__dirname, "../../.env"),
  ];

  for (const file of possibleFiles) {
    if (!fs.existsSync(file)) continue;

    const content = fs.readFileSync(file, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalIndex = trimmed.indexOf("=");

      if (equalIndex === -1) continue;

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    break;
  }
}

loadEnvFile();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Make sure it exists in .env.local or .env."
  );
}

async function resetBookings() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    try {
      await db.collection("bookings").drop();
      console.log("✓ bookings collection deleted");
    } catch (error) {
      if (error.codeName === "NamespaceNotFound") {
        console.log("✓ bookings collection did not exist");
      } else {
        throw error;
      }
    }

    try {
      await db.collection("bookinglocks").drop();
      console.log("✓ bookinglocks collection deleted");
    } catch (error) {
      if (error.codeName === "NamespaceNotFound") {
        console.log("✓ bookinglocks collection did not exist");
      } else {
        throw error;
      }
    }

    console.log("");
    console.log("=================================");
    console.log("BOOKING RESET COMPLETE");
    console.log("=================================");
    console.log("Bookings:     CLEAN");
    console.log("BookingLocks: CLEAN");
    console.log("=================================");
  } catch (error) {
    console.error("");
    console.error("❌ Reset failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

resetBookings();
