import express from "express";
import {
  createBooking,
  getOccupiedSeats,
} from "../controllers/bookingController.js";
import { notAllowed } from "../middleware/error.js";

const bookingRoutes = express.Router();

bookingRoutes.post("/createBooking", createBooking);
bookingRoutes.all("/create", notAllowed);
bookingRoutes.get("/seats/:showId", getOccupiedSeats);
bookingRoutes.all("/seats/:showId", notAllowed);

export default bookingRoutes;
