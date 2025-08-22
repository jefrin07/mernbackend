import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const adminauth = async (req, res, next) => {
  try {
    const token = req.cookies.token; // read token from cookie

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach admin user to request (optional)
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};
