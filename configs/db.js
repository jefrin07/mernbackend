import mongoose from "mongoose";
const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connection established successfully");
    });
    await mongoose.connect(`${process.env.MONGO_URI}/bms`);
  } catch (error) {
    console.log("Database connection failed:", error.message);
  }
};

export default connectDB;