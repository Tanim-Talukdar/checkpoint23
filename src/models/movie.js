import mongoose from "mongoose";

const MovieSchema = new mongoose.Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true,
    },

    poster: {
      type: String,
      default: "",
    },

    backdrop: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    genres: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number,
      default: 0,
    },

    releaseDate: {
      type: String,
      default: "",
    },

    trailer: {
      type: String,
      default: "",
    },

    director: {
      type: String,
      default: "",
    },

    cast: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Movie ||
  mongoose.model("Movie", MovieSchema);