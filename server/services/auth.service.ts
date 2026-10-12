
import { prisma } from "../db/db";
import { ApiError } from "../utils/ApiError";

export const authService = {
  async login(email: string) {
    if (!email?.trim()) {
      throw new ApiError(400, "Email is required");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "No account with that email");
    }

    return user;
  },
};
