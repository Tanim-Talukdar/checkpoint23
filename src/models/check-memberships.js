import mongoose from "mongoose";
import dotenv from "dotenv";
import Membership from "../models/membership.js";

dotenv.config({ path: ".env.local" });

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env.local");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");
    console.log("Fetching all memberships...\n");

    const memberships = await Membership.find({})
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Total memberships: ${memberships.length}\n`);

    if (memberships.length === 0) {
      console.log("No memberships found.");
      return;
    }

    console.log(JSON.stringify(memberships, null, 2));
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB connection closed.");
  }
}

main();