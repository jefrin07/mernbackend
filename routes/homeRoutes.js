import express from "express";
import { getMovieDetails, getMovies, getShowDetails } from "../controllers/homeController.js";
import { notAllowed } from "../middleware/error.js";

const homeRoutes = express.Router();

homeRoutes.route("/").get(getMovies).all(notAllowed);
homeRoutes.route("/:id").get(getMovieDetails).all(notAllowed);
homeRoutes.route("/:id/:date").get(getShowDetails).all(notAllowed);

export default homeRoutes;
