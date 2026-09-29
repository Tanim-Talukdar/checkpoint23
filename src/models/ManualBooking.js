import mongoose from "mongoose";

const manualBookingSchema = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      enum: ["seat", "full-hall"],
      required: true,
    },

    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      default: null,
    },

    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      default: null,
    },

    movieSnapshot: {
      title: {
        type: String,
        default: "",
      },
      poster: {
        type: String,
        default: "",
      },
      backdrop: {
        type: String,
        default: "",
      },
      duration: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 0,
      },
    },

    showtimeSnapshot: {
      date: {
        type: String,
        default: "",
      },
      startTime: {
        type: String,
        default: "",
      },
      ticketPrice: {
        type: Number,
        default: 0,
      },
    },

    manualMovieName: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },

    seats: {
      type: [String],
      default: [],
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash"],
      default: "cash",
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

manualBookingSchema.index({
  hallId: 1,
  date: 1,
  time: 1,
});

manualBookingSchema.index({
  showtimeId: 1,
  seats: 1,
});

export default mongoose.models.ManualBooking ||
  mongoose.model("ManualBooking", manualBookingSchema);