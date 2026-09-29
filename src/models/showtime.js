import mongoose from "mongoose";

const ShowtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

ShowtimeSchema.index(
  {
    movieId: 1,
    hallId: 1,
    date: 1,
    startTime: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.Showtime ||
  mongoose.model("Showtime", ShowtimeSchema);