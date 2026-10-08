import mongoose from "mongoose";

const PriceHistorySchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    type: {
      type: String,
      enum: [
        "day_pass",
        "membership",
        "activity",
        "private_movie",
      ],
      required: true,
    },

    pricingType: {
      type: String,
      enum: [
        "per_person",
        "per_booking",
        "per_ticket",
        "monthly",
      ],
      required: true,
    },

    /*
     * Current active price.
     *
     * This is kept for quick access from the admin
     * interface. Actual historical pricing is stored
     * inside priceHistory.
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Every price change creates a new record here.
     *
     * Example:
     *
     * 500 → Oct 1
     * 550 → Nov 1
     * 600 → Dec 1
     *
     * A booking on October 20 uses 500.
     * A booking on November 10 uses 550.
     */
    priceHistory: {
      type: [PriceHistorySchema],
      default: [],
    },

    capacity: {
      type: Number,
      min: 1,
      default: null,
    },

    durationMinutes: {
      type: Number,
      min: 1,
      default: null,
    },

    minimumQuantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    maximumQuantity: {
      type: Number,
      min: 1,
      default: null,
    },

    exclusive: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const ScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
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

    slotDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

const FacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    facilityType: {
      type: String,
      enum: [
        "fitness",
        "steam",
        "playground",
        "movie",
      ],
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    /*
     * Playground is a shared physical resource.
     *
     * Futsal, Basketball, Badminton and Pickleball
     * all use the same physical space.
     */
    sharedResource: {
      type: Boolean,
      default: false,
    },

    services: {
      type: [ServiceSchema],
      default: [],
    },

    /*
     * Recurring weekly schedule.
     *
     * dayOfWeek:
     * 0 = Sunday
     * 1 = Monday
     * 2 = Tuesday
     * 3 = Wednesday
     * 4 = Thursday
     * 5 = Friday
     * 6 = Saturday
     */
    schedules: {
      type: [ScheduleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

FacilitySchema.index(
  { slug: 1 },
  { unique: true }
);

FacilitySchema.index({
  active: 1,
});

export default mongoose.models.Facility ||
  mongoose.model("Facility", FacilitySchema);