import { asyncHandler } from "../middleware/error.js";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import mongoose from "mongoose";

export const getMovies = asyncHandler(async (_req, res) => {
  const now = new Date();
  const movies = await Movie.find({ now_playing: true });
  const filteredMovies = [];
  for (const movie of movies) {
    const hasActiveShow = await Show.exists({
      movie: movie._id,
      showDateTime: { $gt: now }, // only shows in future
      is_active: true,
    });

    if (hasActiveShow) {
      filteredMovies.push(movie);
    }
  }
  res.json({
    status: 200,
    message: "Now playing movies with active shows",
    data: filteredMovies,
  });
});

export const getMovieDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const now = new Date();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid movie ID" });
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ status: 404, message: "Movie not found" });
  }

  const shows = await Show.find({
    movie: id,
    showDateTime: { $gt: now },
    is_active: true,
  }).sort("showDateTime");

  res.json({
    status: 200,
    message: "Movie details with active shows",
    data: { movie, shows },
  });
});

export const getShowDetails = asyncHandler(async (req, res) => {
  const { id, date } = req.params;
  const now = new Date();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: "Invalid movie ID" });
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ status: 404, message: "Movie not found" });
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const shows = await Show.find({
    movie: id,
    showDateTime: { $gte: startOfDay, $lte: endOfDay, $gt: now },
    is_active: true,
  }).sort("showDateTime");

  res.json({
    status: 200,
    message: "Shows fetched successfully",
    data: { movie, shows },
  });
});

