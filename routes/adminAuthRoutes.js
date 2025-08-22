import express from "express";
import { notAllowed } from "../middleware/error.js";
import { login, logout } from "../controllers/adminAuthController.js";
import { adminauth } from "../middleware/adminauth.js";

const adminAuthRoutes = express.Router();

adminAuthRoutes.route("/login").post(login).all(notAllowed);
adminAuthRoutes.route("/logout").post(adminauth,logout).all(notAllowed);


export default adminAuthRoutes;
