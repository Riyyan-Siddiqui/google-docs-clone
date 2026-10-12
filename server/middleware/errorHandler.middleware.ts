
import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

export const errorHandler: ErrorRequestHandler = (
  error, _req, res, _next,
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
    ).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "File exceeds the 2 MB limit"
          : "File upload failed",
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: "Internal server error",
  });
};
