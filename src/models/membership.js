import mongoose from "mongoose";

const DailyEntrySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },

    checkedInAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const RenewalHistorySchema = new mongoose.Schema(
  {
    renewedAt: {
      type: Date,
      required: true,
    },

    previousStartDate: {
      type: Date,
      required: true,
    },

    previousExpiryDate: {
      type: Date,
      required: true,
    },

    newStartDate: {
      type: Date,
      required: true,
    },

    newExpiryDate: {
      type: Date,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    paymentTransactionId: {
      type: String,
      default: "",
      trim: true,
    },

    adminId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const MembershipSchema = new mongoose.Schema(
  {
    membershipCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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

    membershipType: {
      type: String,
      enum: [
        "gym",
        "pool",
        "gym_pool",
      ],
      required: true,
    },

    facilities: {
      type: [String],
      enum: [
        "gym",
        "pool",
      ],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    dailyEntries: {
      type: [DailyEntrySchema],
      default: [],
    },

    /*
     * Complete permanent renewal history.
     *
     * lastRenewedAt and renewalCount are kept as convenient
     * summary fields, while this array preserves every renewal.
     */
    renewalHistory: {
      type: [RenewalHistorySchema],
      default: [],
    },

    lastRenewedAt: {
      type: Date,
      default: null,
    },

    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

MembershipSchema.index({
  customerEmail: 1,
  active: 1,
});

MembershipSchema.index({
  customerPhone: 1,
  active: 1,
});

MembershipSchema.index({
  expiryDate: 1,
});

MembershipSchema.index({
  membershipType: 1,
  active: 1,
});

export default mongoose.models.Membership ||
  mongoose.model("Membership", MembershipSchema);