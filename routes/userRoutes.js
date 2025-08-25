import express from "express";
import { getFavoriteMovies, getUserBookings, updateFavorite } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/bookings", getUserBookings);
userRouter.post("/updateFav", updateFavorite);
userRouter.get("/getFav", getFavoriteMovies);

export default userRouter;
