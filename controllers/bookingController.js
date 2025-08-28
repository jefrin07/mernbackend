import Show from "../models/Show.js";
import Booking from "../models/Booking.js";


export const createBooking = async (req, res) => {
  try {

    const { userId } = req.auth(); 
    const { showId, selectedSeats } = req.body;
    if (!showId || !selectedSeats || !Array.isArray(selectedSeats)) {
      console.log("Invalid request data");
      return res.status(400).json({
        success: false,
        message: "showId and selectedSeats are required and must be an array",
      });
    }
    const showData = await Show.findById(showId).populate("movie");
    if (!showData) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    const unavailableSeats = selectedSeats.filter(
      (seat) => showData.occupied_seats[seat]
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already occupied",
        unavailableSeats,
      });
    }

    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    selectedSeats.forEach((seat) => {
      showData.occupied_seats[seat] = userId; // or true if you don't need userId
    });
    showData.markModified("occupied_seats");
    await showData.save();
    res.status(201).json({
      success: true,
      message: "Booking successful",
      data: {
        booking,
        show: showData,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId).lean();
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }
    const occupiedSeats = Object.keys(show.occupied_seats || {});
    res.json({
      success: true,
      message: "Occupied seats fetched successfully",
      data: occupiedSeats,
    });
  } catch (error) {
    console.error("Error fetching occupied seats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
