
import type { RequestHandler } from "express";
import { prisma } from "../db/db";
import { ApiError } from "../utils/ApiError";

export const requireUser: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const userId = req.header("X-User-Id");

    if (!userId) {
      throw new ApiError(401, "Not signed in");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new ApiError(401, "Invalid user");
    }

    res.locals.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};
