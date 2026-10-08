import mongoose from "mongoose";

const BookingLockSchema = new mongoose.Schema(
  {
    bookingGroupReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
      index: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    resourceKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    timeSlice: {
      type: String,
      required: true,
      trim: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    unit: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Pending booking:
     *
     *     expiresAt = booking expiry
     *
     * Confirmed booking:
     *
     *     expiresAt = null
     *
     * MongoDB TTL automatically removes pending locks
     * when their expiry time is reached.
     */
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------
// RESOURCE LOCK UNIQUENESS
// ------------------------------------------------------------

BookingLockSchema.index(
  {
    bookingDate: 1,
    resourceKey: 1,
    timeSlice: 1,
    unit: 1,
  },
  {
    unique: true,
  }
);

// ------------------------------------------------------------
// TTL INDEX
// ------------------------------------------------------------

/*
 * Automatically release pending resource locks.
 *
 * expireAfterSeconds: 0 means MongoDB deletes the document
 * once expiresAt is reached.
 *
 * Confirmed locks have expiresAt = null, so they remain.
 */
BookingLockSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

// ------------------------------------------------------------
// ADDITIONAL INDEXES
// ------------------------------------------------------------

BookingLockSchema.index({
  bookingGroupReference: 1,
});

BookingLockSchema.index({
  bookingId: 1,
});

export default mongoose.models.BookingLock ||
  mongoose.model(
    "BookingLock",
    BookingLockSchema
  );