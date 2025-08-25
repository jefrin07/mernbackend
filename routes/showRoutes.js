import express from "express";
import {
  createShow,
  deleteShowById,
  getShowsByMovie,
  toggleShowActive,
} from "../controllers/showController.js";
import { notAllowed } from "../middleware/error.js";

const showRoutes = express.Router();

showRoutes
  .route("/:id")
  .get(getShowsByMovie)
  .delete(deleteShowById)
  .post(createShow)
  .all(notAllowed);

showRoutes.route("/:showId/toggle-active").put(toggleShowActive).all(notAllowed);

export default showRoutes;
