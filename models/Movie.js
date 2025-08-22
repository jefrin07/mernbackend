import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    overview: {
      type: String,
    },
    poster_path: {
      type: String,
    },
    backdrop_path: {
      type: String,
    },
    release_date: {
      type: Date,
    },
    original_language: {
      type: String,
    },
    tagline: {
      type: String,
    },
    geners: {
      type: [String],
    },
    vote_average: {
      type: Number,
    },
    runtime: {
      type: Number,
    },
    now_playing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
