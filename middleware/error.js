import logger from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;

  // 🛑 Handle mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = {};
    for (let field in err.errors) {
      const message = err.errors[field].message.replace(/Path `.*`/, field);
      errors[field] = message;
    }
    return res.status(400).json({
      status: 400,
      message: "Validation Failed",
      errors, // 👈 frontend can use this
    });
  }

  const payload = {
    status,
    message: err.expose ? err.message : "Internal Server Error",
  };

  if (status >= 500) logger.error({ err }, "Unhandled error");
  res.status(status).json(payload);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notAllowed(_req, res) {
  res.status(405).json({ message: "Method Not Allowed" });
}
