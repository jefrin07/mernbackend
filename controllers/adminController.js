import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";

export const isAdmin = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata.role === "admin") {
      return res.json({ success: true, isAdmin: true });
    } else {
      return res.json({ success: true, isAdmin: false });
    }
  } catch (error) {
    console.error("Error in isAdmin:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });

    const activeShows = await Show.find({
      is_active: true,
      showDateTime: { $gte: new Date() },
    }).populate("movie"); // ✅ populate movie info (title, poster, rating, etc.)

    const totalUsers = await User.countDocuments();

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (booking.amount || 0),
      0
    );

    const dashdata = {
      totalBookings: bookings.length,
      totalRevenue,
      totalUsers,
      totalActiveShows: activeShows.length,
      activeShows, // ✅ send the array to frontend
    };

    res.json({ success: true, data: dashdata });
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() }, // upcoming shows only
    })
      .populate("movie") // get movie details
      .sort({ showDateTime: 1 }); // earliest first

    res.json({
      success: true,
      shows,
    });
  } catch (error) {
    console.error("Error fetching shows:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user", "firstName lastName email") // only return selected fields
      .populate({
        path: "show",
        populate: { path: "movie", select: "title genre duration" }, // populate movie inside show
      })
      .sort({ createdAt: -1 })
      .lean(); // return plain JSON

    res.json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
