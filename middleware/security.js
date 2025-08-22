import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";

export function security() {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
  });

  return [
    helmet(),
    cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }),
    compression(),
    limiter
  ];
}
