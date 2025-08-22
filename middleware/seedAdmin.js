import mongoose from "mongoose";
import Admin from "../models/Admin.js";

// Always wrap the URI in quotes
const MONGO_URI = "mongodb+srv://jefrinferolous08:ANnodxtcT5Srcy9X@cluster0.wn3sfes.mongodb.net/bms";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await Admin.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("✅ Admin already exists:", existingAdmin.email);
      return process.exit();
    }

    const admin = new Admin({
      name: "Admin",
      email: "admin@example.com",
      password: "password123",
    });

    await admin.save();
    console.log("🎉 Admin created:", admin.email);
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
