import express from "express";
import {
  getAllBookings,
  getAllShows,
  getDashboardData,
  isAdmin,
} from "../controllers/adminController.js";
import { adminauth } from "../middleware/adminauth.js";

const adminRoutes = express.Router();

adminRoutes.get("/isAdmin", isAdmin);
adminRoutes.get("/getDashboardData", adminauth, getDashboardData);
adminRoutes.get("/getAllShows", adminauth, getAllShows);
adminRoutes.get("/getAllBookings", adminauth, getAllBookings);

export default adminRoutes;
