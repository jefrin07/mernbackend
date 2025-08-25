import Show from "../models/Show.js";
import Booking from "../models/Booking.js";

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth(); // adjust based on your auth middleware
    const { showId, selectedSeats } = req.body;

    // 1. Check seat availability
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already occupied",
      });
    }

    // 2. Get show
    const showData = await Show.findById(showId).populate("movie");
    if (!showData) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // 3. Create booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    // 4. Mark seats as occupied
    selectedSeats.forEach((seat) => {
      showData.occupied_seats[seat] = userId; // or `true` if you don’t need userId
    });
    showData.markModified("occupied_seats");
    await showData.save();

    // 5. Send success response
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
