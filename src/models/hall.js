import mongoose from "mongoose";

const SeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
    },
    row: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const HallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      default: 50,
    },

    rows: {
      type: Number,
      required: true,
      default: 5,
    },

    seatsPerRow: {
      type: Number,
      required: true,
      default: 10,
    },

    seats: {
      type: [SeatSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Hall ||
  mongoose.model("Hall", HallSchema);