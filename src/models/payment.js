import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    bookingGroupReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    bookingIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
        },
      ],
      default: [],
    },

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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "BDT",
      uppercase: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      default: "SSLCommerz",
      trim: true,
    },

    gatewayTransactionId: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      index: true,
    },

    gatewayValidationId: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({
  bookingGroupReference: 1,
  createdAt: -1,
});

PaymentSchema.index({
  customerEmail: 1,
  createdAt: -1,
});

PaymentSchema.index({
  status: 1,
  createdAt: -1,
});

PaymentSchema.index({
  gatewayTransactionId: 1,
});

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);