
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

  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    // Ignore empty lines and comments
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

    // Remove surrounding quotes
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

function findMongoURI() {
  // Change nothing if your existing variable
  // is already one of these common names.
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL
  );
}

async function fixTTLIndex(
  db,
  collectionName
) {
  const collection =
    db.collection(collectionName);

  console.log(
    `\nChecking collection: ${collectionName}`
  );

  const indexes =
    await collection.indexes();

  const expiryIndexes =
    indexes.filter(
      (index) =>
        index.key &&
        index.key.expiresAt === 1 &&
        Object.keys(index.key).length === 1
    );

  if (expiryIndexes.length === 0) {
    console.log(
      "No existing single-field expiresAt index found."
    );
  }

  for (const index of expiryIndexes) {
    if (
      index.expireAfterSeconds === 0
    ) {
      console.log(
        `✅ TTL index already exists: ${index.name}`
      );

      continue;
    }

    console.log(
      `Removing old normal index: ${index.name}`
    );

    await collection.dropIndex(
      index.name
    );

    console.log(
      `✅ Removed: ${index.name}`
    );
  }

  const refreshedIndexes =
    await collection.indexes();

  const hasTTLIndex =
    refreshedIndexes.some(
      (index) =>
        index.key &&
        index.key.expiresAt === 1 &&
        Object.keys(index.key).length === 1 &&
        index.expireAfterSeconds === 0
    );

  if (hasTTLIndex) {
    console.log(
      `✅ ${collectionName} already has the correct TTL index.`
    );

    return;
  }

  console.log(
    "Creating TTL index..."
  );

  await collection.createIndex(
    {
      expiresAt: 1,
    },
    {
      name: "expiresAt_1",
      expireAfterSeconds: 0,
    }
  );

  console.log(
    `✅ TTL index created for ${collectionName}.`
  );
}

async function main() {
  let connected = false;

  try {
    console.log(
      "=========================================="
    );

    console.log(
      "CHECKPOINT BOOKING EXPIRY MIGRATION"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `\nLoading environment from:`
    );

    console.log(
      envPath
    );

    loadEnvFile(envPath);

    const mongoURI =
      findMongoURI();

    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string was not found in .env.local.\n\n" +
        "Expected one of:\n" +
        "MONGODB_URI\n" +
        "MONGO_URI\n" +
        "DATABASE_URL"
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
      "✅ MongoDB connected."
    );

    const db =
      mongoose.connection.db;

    /*
     * IMPORTANT:
     *
     * These are the MongoDB collection names,
     * not the Mongoose model names.
     *
     * If your actual collections are different,
     * the script will tell you below.
     */

    const collections =
      await db
        .listCollections()
        .toArray();

    const collectionNames =
      collections.map(
        (collection) =>
          collection.name
      );

    console.log(
      "\nExisting collections:"
    );

    console.log(
      collectionNames.join(", ")
    );

    const bookingCollection =
      collectionNames.includes(
        "bookings"
      )
        ? "bookings"
        : null;

    const bookingLockCollection =
      collectionNames.includes(
        "bookinglocks"
      )
        ? "bookinglocks"
        : collectionNames.includes(
            "bookingLocks"
          )
          ? "bookingLocks"
          : null;

    if (!bookingCollection) {
      throw new Error(
        '\n"bookings" collection was not found.'
      );
    }

    if (!bookingLockCollection) {
      throw new Error(
        '\nBookingLock collection was not found.\n' +
        'Expected "bookinglocks" or "bookingLocks".'
      );
    }

    await fixTTLIndex(
      db,
      bookingCollection
    );

    await fixTTLIndex(
      db,
      bookingLockCollection
    );

    console.log(
      "\n=========================================="
    );

    console.log(
      "✅ MIGRATION COMPLETE"
    );

    console.log(
      "=========================================="
    );

    console.log(
      "\nBooking:"
    );

    console.log(
      "expiresAt → TTL 0 seconds"
    );

    console.log(
      "\nBookingLock:"
    );

    console.log(
      "expiresAt → TTL 0 seconds"
    );

    console.log(
      "\nPending bookings will automatically"
    );

    console.log(
      "be removed after their expiresAt time."
    );

    console.log(
      "\nConfirmed/paid bookings have"
    );

    console.log(
      "expiresAt = null, so they are protected."
    );

    console.log(
      "\nYou can now delete this script."
    );
  } catch (error) {
    console.error(
      "\n❌ MIGRATION FAILED"
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
