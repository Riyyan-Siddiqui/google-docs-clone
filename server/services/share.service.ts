
import { ApiError } from "../utils/ApiError";

async function requireOwner(
  documentId: string,
  userId: string,
) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, ownerId: userId },
    select: { id: true },
  });

  if (!document) {
    throw new ApiError(
      404,
      "Document not found or you are not the owner",
    );
  }

  return document;
}

export const shareService = {
  async list(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: userId },
          { shares: { some: { userId } } },
        ],
      },
      select: { id: true },
    });

    if (!document) {
      throw new ApiError(404, "Document not found or no access");
    }

    return prisma.documentShare.findMany({
      where: { documentId },
      select: {
        userId: true,
        role: true,
        user: {
          select: { name: true, email: true },
        },
      },
    }).then((shares: any) =>
      shares.map((share: any) => ({
        userId: share.userId,
        name: share.user.name,
        email: share.user.email,
        role: share.role,
      })),
    );
  },

  async add(
    documentId: string,
    ownerId: string,
    email: string,
    role: "editor" | "viewer",
  ) {
    await requireOwner(documentId, ownerId);

    if (!["editor", "viewer"].includes(role)) {
      throw new ApiError(400, "Invalid share role");
    }

    const target = await prisma.user.findUnique({
      where: { email: email.trim() },
      select: { id: true, name: true, email: true },
    });

    if (!target) {
      throw new ApiError(404, "No user with that email");
    }

    if (target.id === ownerId) {
      throw new ApiError(400, "You already own this document");
    }

    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId: target.id,
        },
      },
      create: {
        documentId,
        userId: target.id,
        role,
      },
      update: { role },
      select: {
        userId: true,
        role: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      userId: share.userId,
      name: share.user.name,
      email: share.user.email,
      role: share.role,
    };
  },

  async remove(
    documentId: string,
    ownerId: string,
    targetUserId: string,
  ) {
    await requireOwner(documentId, ownerId);

    await prisma.documentShare.deleteMany({
      where: {
        documentId,
        userId: targetUserId,
      },
    });
  },
};
