import { clerkClient } from "@clerk/express";

export const adminauth = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: Admins only" });
    }
    next();
  } catch (error) {
    console.error("Error in protectAdmin middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
