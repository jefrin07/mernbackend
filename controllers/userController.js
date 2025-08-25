import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId; // assuming req.auth() gives you authenticated user

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "User bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: "movieId is required",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    // Ensure favorites exists
    let favorites = user.privateMetadata.favorites || [];

    // Toggle logic
    if (favorites.includes(movieId)) {
      favorites = favorites.filter((id) => id !== movieId);
    } else {
      favorites.push(movieId);
    }

    // Save updated metadata
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { ...user.privateMetadata, favorites },
    });

    res.json({
      success: true,
      message: "Favorite updated successfully",
      favorites,
    });
  } catch (error) {
    console.error("Error updating favorites:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFavoriteMovies = async (req, res) => {
  try {
    const userId = req.auth().userId;

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // Read favorites from metadata
    const favorites = user.privateMetadata.favorites || [];

    if (favorites.length === 0) {
      return res.json({
        success: true,
        message: "No favorite movies found",
        favorites: [],
      });
    }

    // Fetch movies from DB
    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({
      success: true,
      message: "Favorite movies fetched successfully",
      favorites: movies,
    });
  } catch (error) {
    console.error("Error fetching favorite movies:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
