
import type { RequestHandler } from "express";
import { shareService } from "../services/share.service";
import { ApiError } from "../utils/ApiError";

export const listShares: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await shareService.list(req.params.id as string, res.locals.userId),
    );
  } catch (error) {
    next(error);
  }
};

export const addShare: RequestHandler = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (typeof email !== "string" ||
        !["editor", "viewer"].includes(role)) {
      throw new ApiError(400, "Valid email and role are required");
    }

    res.status(200).json(
      await shareService.add(
        req.params.id as string,
        res.locals.userId,
        email,
        role,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const removeShare: RequestHandler = async (req, res, next) => {
  try {
    await shareService.remove(
      req.params.id as string,
      res.locals.userId,
      req.params.userId as string,
    );

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
