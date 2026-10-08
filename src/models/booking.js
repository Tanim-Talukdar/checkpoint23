import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // BOOKING IDENTIFICATION
    // ------------------------------------------------------------

    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    bookingGroupReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ------------------------------------------------------------
    // CUSTOMER
    // ------------------------------------------------------------

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    // ------------------------------------------------------------
    // FACILITY / SERVICE
    // ------------------------------------------------------------

    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
      index: true,
    },

    facilityName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    // ------------------------------------------------------------
    // BOOKING TIME
    // ------------------------------------------------------------

    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    // ------------------------------------------------------------
    // QUANTITY / PRICE
    // ------------------------------------------------------------

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    priceAtBooking: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ------------------------------------------------------------
    // MOVIE
    // ------------------------------------------------------------

    movieName: {
      type: String,
      default: "",
      trim: true,
    },

    // ------------------------------------------------------------
    // BOOKING STATUS
    // ------------------------------------------------------------

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // ------------------------------------------------------------
    // PAYMENT STATUS
    // ------------------------------------------------------------

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    paymentTransactionId: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    paymentValidationId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentBankTransactionId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentCardType: {
      type: String,
      default: "",
      trim: true,
    },

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    paymentInitiatedAt: {
      type: Date,
      default: null,
    },

    paymentPaidAt: {
      type: Date,
      default: null,
    },

    // ------------------------------------------------------------
    // PENDING BOOKING EXPIRATION
    // ------------------------------------------------------------

    /*
     * IMPORTANT:
     *
     * MongoDB TTL automatically deletes this Booking document
     * when expiresAt is reached.
     *
     * Pending booking:
     *   expiresAt = creation time + 15 minutes
     *
     * Confirmed booking:
     *   expiresAt = null
     *
     * Therefore confirmed bookings are NOT deleted by TTL.
     */
    expiresAt: {
      type: Date,
      default: null,
    },

    // ------------------------------------------------------------
    // CHECK-IN / CHECK-OUT
    // ------------------------------------------------------------

    checkedIn: {
      type: Boolean,
      default: false,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedOut: {
      type: Boolean,
      default: false,
    },

    checkedOutAt: {
      type: Date,
      default: null,
    },

    // ------------------------------------------------------------
    // CANCELLATION
    // ------------------------------------------------------------

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------
// NORMAL INDEXES
// ------------------------------------------------------------

BookingSchema.index({
  facilityId: 1,
  bookingDate: 1,
  startTime: 1,
});

BookingSchema.index({
  facilityId: 1,
  bookingDate: 1,
  status: 1,
});

BookingSchema.index({
  customerEmail: 1,
  bookingDate: -1,
});

BookingSchema.index({
  customerPhone: 1,
  bookingDate: -1,
});

BookingSchema.index({
  status: 1,
  bookingDate: 1,
});

BookingSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

BookingSchema.index({
  bookingGroupReference: 1,
  createdAt: 1,
});

BookingSchema.index({
  paymentTransactionId: 1,
});

// ------------------------------------------------------------
// TTL INDEX
// ------------------------------------------------------------

/*
 * MongoDB automatically removes the Booking document when
 * expiresAt is reached.
 *
 * expireAfterSeconds: 0 means:
 *
 *     delete when expiresAt <= current MongoDB time
 *
 * IMPORTANT:
 *
 * Only documents with a Date value in expiresAt are removed.
 *
 * Confirmed bookings have:
 *
 *     expiresAt: null
 *
 * so they are NOT removed.
 */
BookingSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

// ------------------------------------------------------------
// STATUS / PAYMENT / EXPIRY QUERY INDEX
// ------------------------------------------------------------

BookingSchema.index({
  expiresAt: 1,
  status: 1,
  paymentStatus: 1,
});

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);