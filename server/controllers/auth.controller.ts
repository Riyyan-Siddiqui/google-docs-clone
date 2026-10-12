
import type { RequestHandler } from "express";
import { authService } from "../services/auth.service";

export const login: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const user = await authService.login(req.body.email);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
