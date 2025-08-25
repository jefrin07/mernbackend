import { asyncHandler } from "../middleware/error.js";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import mongoose from "mongoose";

export const createShow = asyncHandler(async (req, res) => {
  const { showDateTime, showPrice } = req.body;
  const { id: movieId } = req.params;

  const errors = {};

  // Validate movie ID
  if (!mongoose.Types.ObjectId.isValid(movieId)) {
    errors.movie = "Invalid movie ID";
  } else {
    const movieExists = await Movie.findById(movieId);
    if (!movieExists) {
      errors.movie = "Movie not found";
    }
  }

  // Validate show price
  if (showPrice === undefined || isNaN(Number(showPrice)) || Number(showPrice) <= 0) {
    errors.showPrice = "Show price must be a number greater than 0";
  }

  // Validate show date and time
  if (!showDateTime) {
    errors.showDateTime = "Show date and time are required";
  } else {
    const date = new Date(showDateTime);
    if (isNaN(date.getTime())) {
      errors.showDateTime = "Valid show date and time are required";
    } else if (date < new Date()) {
      errors.showDateTime = "Show date and time cannot be in the past";
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Validation failed",
      errors,
    });
  }

  // Create show
  const show = new Show({
    movie: movieId,
    showDateTime: new Date(showDateTime),
    showPrice: Number(showPrice),
  });

  await show.save();

  res.status(201).json({
    status: 201,
    message: "Show created successfully",
    data: show,
  });
});


export const getShowsByMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const shows = await Show.find({ movie: id }).sort({ showDateTime: 1 });

  res.status(200).json({
    status: 200,
    message: "Shows fetched successfully",
    data: shows,
  });
});

export const deleteShowById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid show ID" });
  }

  const show = await Show.findById(id);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  await show.deleteOne(); // or show.remove() in older mongoose versions

  res.status(200).json({
    status: 200,
    message: "Show deleted successfully",
  });
});

export const toggleShowActive = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(showId)) {
    return res.status(400).json({ message: "Invalid show ID" });
  }

  // Find the show
  const show = await Show.findById(showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  // Toggle the is_active field
  show.is_active = !show.is_active;
  await show.save();

  res.status(200).json({
    status: 200,
    message: `Show is now ${show.is_active ? "ACTIVE" : "INACTIVE"}`,
    data: show,
  });
});
