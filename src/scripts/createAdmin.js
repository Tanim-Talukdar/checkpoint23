import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Admin from "../models/admin.js";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const {
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD
    ) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    await mongoose.connect(MONGODB_URI);

    const email = ADMIN_EMAIL.toLowerCase().trim();

    const existingAdmin = await Admin.findOne({
      email,
    });

    // If admin already exists, make sure it is the main admin
    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME;
      existingAdmin.role = "admin";
      existingAdmin.adminLevel = "main";
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log(
        "Existing admin updated as main admin."
      );

      return;
    }

    // Create password hash
    const passwordHash = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    );

    // Create main admin
    await Admin.create({
      name: ADMIN_NAME,
      email,
      passwordHash,
      role: "admin",
      adminLevel: "main",
      isActive: true,
    });

    console.log(
      "Main admin created successfully."
    );
  } catch (error) {
    console.error(
      "Failed to create/update admin:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();