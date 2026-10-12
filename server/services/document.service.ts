
import { prisma } from "../db/db";
import { ApiError } from "../utils/ApiError";

const summarySelect = {
  id: true,
  title: true,
  updatedAt: true,
  owner: {
    select: {
      name: true,
    },
  },
} as const;

async function getAccessibleDocument(
  documentId: string,
  userId: string,
) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      OR: [
        { ownerId: userId },
        { shares: { some: { userId } } },
      ],
    },
    include: {
      shares: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!document) {
    throw new ApiError(404, "Document not found or no access");
  }

  const role =
    document.ownerId === userId
      ? "owner"
      : document.shares[0]?.role;

  return { document, role };
}

export const documentService = {
  async list(userId: string) {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { shares: { some: { userId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        ...summarySelect,
        ownerId: true,
        shares: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    return documents.map((document) => ({
      id: document.id,
      title: document.title,
      updatedAt: document.updatedAt,
      ownerName: document.owner.name,
      role:
        document.ownerId === userId
          ? "owner"
          : document.shares[0]?.role,
    }));
  },

  async get(documentId: string, userId: string) {
    const { document, role } =
      await getAccessibleDocument(documentId, userId);

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt,
      ownerName: (
        await prisma.user.findUniqueOrThrow({
          where: { id: document.ownerId },
          select: { name: true },
        })
      ).name,
      role,
    };
  },

  async create(userId: string, title?: string) {
    const normalizedTitle = title?.trim() || "Untitled document";

    if (normalizedTitle.length > 120) {
      throw new ApiError(400, "Title cannot exceed 120 characters");
    }

    const document = await prisma.document.create({
      data: {
        title: normalizedTitle,
        ownerId: userId,
      },
      select: {
        ...summarySelect,
        content: true,
      },
    });

    return {
      id: document.id,
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt,
      ownerName: document.owner.name,
      role: "owner" as const,
    };
  },

  async update(
    documentId: string,
    userId: string,
    patch: { title?: string; content?: string },
  ) {
    const { document, role } =
      await getAccessibleDocument(documentId, userId);

    if (role === "viewer") {
      throw new ApiError(403, "You have view-only access.");
    }

    if (patch.title === undefined && patch.content === undefined) {
      throw new ApiError(400, "No changes provided");
    }

    if (
      patch.title !== undefined &&
      (patch.title.trim().length < 1 ||
        patch.title.trim().length > 120)
    ) {
      throw new ApiError(400, "Title must be 1–120 characters");
    }

    const data: { title?: string; content?: string } = {};

    if (patch.title !== undefined) {
      data.title = patch.title.trim();
    }

    if (patch.content !== undefined) {
      data.content = patch.content;
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data,
      select: {
        ...summarySelect,
        content: true,
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      updatedAt: updated.updatedAt,
      ownerName: updated.owner.name,
      role,
    };
  },

  async remove(documentId: string, userId: string) {
    const { document } =
      await getAccessibleDocument(documentId, userId);

    if (document.ownerId !== userId) {
      throw new ApiError(403, "Only the owner can delete.");
    }

    await prisma.document.delete({
      where: { id: document.id },
    });
  },
};
