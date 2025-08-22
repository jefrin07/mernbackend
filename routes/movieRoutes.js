import express from "express";
import {
  createMovie,
  deleteMovie,
  getMovies,
  toggleNowPlaying,
  getMovieById,
  updateMovieById,
  uploadPoster,
  uploadBackdrop
} from "../controllers/movieController.js";
import { notAllowed } from "../middleware/error.js";
import multer from "multer";

const storage = multer.memoryStorage(); // keep files in memory for now
const upload = multer({ storage });

const movieRoutes = express.Router();

movieRoutes
  .route("/")
  .get(getMovies)
  .post(
    upload.fields([
      { name: "poster_path", maxCount: 1 },
      { name: "backdrop_path", maxCount: 1 },
    ]),
    createMovie
  )
  .all(notAllowed);

movieRoutes.route("/delete/:id").delete(deleteMovie).all(notAllowed);

movieRoutes
  .route("/:id/toggle-now-playing")
  .put(toggleNowPlaying)
  .all(notAllowed);

movieRoutes
  .route("/:id")
  .get(getMovieById)
  .put(updateMovieById)
  .all(notAllowed);

movieRoutes
  .route("/:id/upload-poster")
  .put(upload.single("image"), uploadPoster)
  .all(notAllowed);

movieRoutes
  .route("/:id/upload-backdrop")
  .put(upload.single("image"), uploadBackdrop)
  .all(notAllowed);

export default movieRoutes;
