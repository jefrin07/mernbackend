import { asyncHandler } from "../middleware/error.js";
import Movie from "../models/Movie.js";
import fs from "fs";
import path from "path";

const saveFile = (file) => {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(uploadDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  return `/uploads/${filename}`;
};

const removeFile = (filePath) => {
  if (!filePath) return;
  const relativePath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const absolutePath = path.join(process.cwd(), relativePath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

export const createMovie = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const body = req.body || {};
  const {
    title,
    overview,
    release_date,
    original_language,
    tagline,
    geners,
    vote_average,
    runtime,
    now_playing,
  } = body;
  const errors = {};

  if (!title || title.trim().length < 2) {
    errors.title = "Title is required and must be at least 2 characters";
  }
  if (!overview || overview.trim().length < 10) {
    errors.overview = "Overview is required and must be at least 10 characters";
  }
  if (!release_date || isNaN(Date.parse(release_date))) {
    errors.release_date = "Valid release date is required";
  }
  if (!geners || !geners.toString().trim()) {
    errors.geners = "Genres are required";
  }
  if (vote_average === undefined || vote_average < 0 || vote_average > 10) {
    errors.vote_average =
      "Vote average is required and must be between 0 and 10";
  }
  if (!runtime || runtime < 1) {
    errors.runtime = "Runtime is required and must be at least 1 minute";
  }
  if (!files.poster_path || files.poster_path.length === 0) {
    errors.poster_path = "Poster file is required";
  }
  if (!files.backdrop_path || files.backdrop_path.length === 0) {
    errors.backdrop_path = "Backdrop file is required";
  }

  if (Object.keys(errors).length > 0) {
    return res
      .status(400)
      .json({ status: 400, message: "Validation Failed", errors });
  }
  const posterPath = saveFile(files.poster_path[0]);
  const backdropPath = saveFile(files.backdrop_path[0]);
  const genresArray = geners
    .toString()
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const movie = new Movie({
    title: title.trim(),
    overview: overview.trim(),
    release_date: new Date(release_date),
    original_language: original_language?.trim() || "",
    tagline: tagline?.trim() || "",
    geners: genresArray,
    vote_average: Number(vote_average),
    runtime: Number(runtime),
    now_playing: now_playing === "true" || now_playing === true,
    poster_path: posterPath,
    backdrop_path: backdropPath,
  });
  await movie.save();
  res
    .status(201)
    .json({ status: 201, message: "Movie created successfully", data: movie });
});

export const getMovies = asyncHandler(async (_req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }
  const removeFile = (filePath) => {
    if (filePath) {
      // remove leading slash to avoid path issues
      const relativePath = filePath.startsWith("/")
        ? filePath.slice(1)
        : filePath;
      const absolutePath = path.join(process.cwd(), relativePath);

      fs.unlink(absolutePath, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${absolutePath}`, err.message);
        }
      });
    }
  };
  removeFile(movie.poster_path);
  removeFile(movie.backdrop_path);
  await movie.deleteOne();
  res.json({ message: "Movie deleted successfully", movie });
});

export const toggleNowPlaying = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movie.now_playing = !movie.now_playing; // toggle true/false
  await movie.save();

  res.json({ message: "Now Playing status updated", movie });
});

export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await Movie.findById(id);

  if (!movie) {
    return res.status(404).json({
      status: 404,
      message: "Movie not found",
    });
  }

  res.status(200).json({
    status: 200,
    message: "Movie fetched successfully",
    data: movie,
  });
});

export const updateMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const errors = {};

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({
      status: 404,
      message: "Movie not found",
    });
  }

  const updateData = {};

  // Title
  if (updates.title !== undefined) {
    if (updates.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters long.";
    } else {
      updateData.title = updates.title.trim();
    }
  }

  // Overview
  if (updates.overview !== undefined) {
    if (updates.overview.trim().length < 10) {
      errors.overview = "Overview must be at least 10 characters.";
    } else {
      updateData.overview = updates.overview.trim();
    }
  }

  // Release Date
  if (updates.release_date !== undefined) {
    if (isNaN(Date.parse(updates.release_date))) {
      errors.release_date = "Invalid release date.";
    } else {
      updateData.release_date = new Date(updates.release_date);
    }
  }
  if (updates.runtime !== undefined) {
    if (Number(updates.runtime) <= 0) {
      errors.runtime = "Runtime must be greater than 0.";
    } else {
      updateData.runtime = Number(updates.runtime);
    }
  }
  if (updates.vote_average !== undefined) {
    if (
      isNaN(updates.vote_average) ||
      Number(updates.vote_average) < 0 ||
      Number(updates.vote_average) > 10
    ) {
      errors.vote_average = "Rating must be a number between 0 and 10.";
    } else {
      updateData.vote_average = Number(updates.vote_average);
    }
  }
  if (updates.tagline !== undefined) {
    updateData.tagline = updates.tagline.trim();
  }
  if (updates.geners !== undefined) {
    const genresArray = updates.geners
      .toString()
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    if (genresArray.length === 0) {
      errors.geners = "At least one genre is required.";
    } else {
      updateData.geners = genresArray;
    }
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Validation failed",
      errors,
    });
  }
  const updatedMovie = await Movie.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 200,
    message: "Movie updated successfully",
    data: updatedMovie,
  });
});

export const uploadPoster = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file; // expect field name = "image"

  if (!file) {
    return res.status(400).json({ message: "Poster image is required" });
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  // remove old poster
  removeFile(movie.poster_path);

  // save new poster
  const posterPath = saveFile(file);
  movie.poster_path = posterPath;
  await movie.save();

  res.status(200).json({
    status: 200,
    message: "Poster updated successfully",
    data: movie,
  });
});

export const uploadBackdrop = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file; // expect field name = "image"

  if (!file) {
    return res.status(400).json({ message: "Backdrop image is required" });
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  // remove old backdrop
  removeFile(movie.backdrop_path);

  // save new backdrop
  const backdropPath = saveFile(file);
  movie.backdrop_path = backdropPath;
  await movie.save();

  res.status(200).json({
    status: 200,
    message: "Backdrop updated successfully",
    data: movie,
  });
});
