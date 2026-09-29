import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    // All these accounts are admins
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },

    // Internal permission level
    adminLevel: {
      type: String,
      enum: ["main", "moderator"],
      default: "moderator",
    },

    // Main admin can disable an admin
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);