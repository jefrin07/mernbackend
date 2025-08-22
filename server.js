import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import cookieParser from "cookie-parser";

import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./inngest/index.js";
import { serve } from "inngest/express";
import { security } from "./middleware/security.js";
import movieRoutes from "./routes/movieRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import { adminauth } from "./middleware/adminauth.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS configuration ---
const corsOptions = {
  origin: "http://localhost:5173", // frontend URL
  credentials: true,               // allow cookies
};
app.use(cors(corsOptions));

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

// Apply security headers **after** CORS
app.use(security());

// --- Serve static files with CORS ---
app.use("/uploads", cors(corsOptions), express.static(path.join(process.cwd(), "uploads")));

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/admin/api/auth", adminAuthRoutes);
app.use("/admin/api/movies", adminauth, movieRoutes);

// --- Error handler ---
app.use(errorHandler);

// --- Start server ---
await connectDB();
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
