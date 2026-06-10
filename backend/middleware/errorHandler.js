const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation error", details: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `${field} already exists` });
  }

  const status  = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
