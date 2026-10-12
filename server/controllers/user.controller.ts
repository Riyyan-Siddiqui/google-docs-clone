
import type { RequestHandler } from "express";
import { prisma } from "../db/db";

export const listUsers: RequestHandler = async (
  _req, res, next,
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};
