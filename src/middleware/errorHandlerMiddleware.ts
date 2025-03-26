import { Request, Response, NextFunction } from "express";

// Custom error interface for status codes
interface CustomError extends Error {
  status?: number;
}

// Enhanced Error Handler Middleware
const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || 500; // Default to 500 if no status code
  const message = err.message || "Something went wrong!";

  // Extract stack trace info (where the error occurred)
  const stackTrace = err.stack ? err.stack.split("\n")[1]?.trim() : "No stack trace available";

  console.error(`❌ ERROR: ${message}`);
  console.error(`🔍 Location: ${stackTrace}`);
  console.error(`🛠️ Request: ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body).length) console.error(`📥 Request Body:`, req.body);

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errorLocation: stackTrace,
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
    },
  });
};

export default errorHandler;
