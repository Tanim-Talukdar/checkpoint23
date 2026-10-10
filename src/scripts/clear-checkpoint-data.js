
import dotenv from "dotenv";
import mongoose from "mongoose";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});


const COLLECTIONS_TO_CLEAR = [
  "bookings",
  "payments",
  "memberships",
];

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection failed");
  }

  const existing = await db
    .listCollections({}, { nameOnly: true })
    .toArray();

  const existingNames = new Set(existing.map((c) => c.name));

  console.log("Database:", db.databaseName);
  console.log("Collections selected for deletion:");

  for (const name of COLLECTIONS_TO_CLEAR) {
    console.log(
      `- ${name}: ${existingNames.has(name) ? "FOUND" : "NOT FOUND"}`
    );
  }

  if (COLLECTIONS_TO_CLEAR.some((name) => !existingNames.has(name))) {
    throw new Error(
      "A collection is missing. Verify the exact collection names before proceeding."
    );
  }

  const rl = readline.createInterface({ input, output });

  try {
    const confirmation = await rl.question(
      'This permanently deletes documents. Type DELETE CHECKPOINT DATA to continue: '
    );

    if (confirmation !== "DELETE CHECKPOINT DATA") {
      console.log("Cancelled. No documents were deleted.");
      return;
    }
  } finally {
    rl.close();
  }

  for (const name of COLLECTIONS_TO_CLEAR) {
    const result = await db.collection(name).deleteMany({});
    console.log(`${name}: deleted ${result.deletedCount} documents`);
  }
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });