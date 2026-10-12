
import type { RequestHandler } from "express";
import multer from "multer";
import mammoth from "mammoth";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../db/db";
import { ApiError } from "../utils/ApiError";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const importDocument: RequestHandler = async (
  req, res, next,
) => {
  try {
    const file = req.file;

    if (!file) {
      throw new ApiError(400, "File is required");
    }

    const extension = file.originalname
      .split(".")
      .pop()
      ?.toLowerCase();

    let html: string;

    if (extension === "docx") {
      const result = await mammoth.convertToHtml({
        buffer: file.buffer,
      });

      html = result.value;
    } else if (extension === "txt" || extension === "md") {
      const text = file.buffer.toString("utf8");

      html = text
        .split(/\r?\n\r?\n/)
        .map(
          (paragraph) =>
            `<p>${paragraph
              .split(/\r?\n/)
              .map(escapeHtml)
              .join("<br>")}</p>`,
        )
        .join("");
    } else {
      throw new ApiError(
        400,
        "Only TXT, MD, and DOCX files are supported",
      );
    }

    const safeHtml = sanitizeHtml(html, {
      allowedTags: [
        "p", "br", "h1", "h2", "h3", "h4",
        "strong", "em", "u", "ul", "ol", "li",
        "blockquote",
      ],
      allowedAttributes: {},
    });

    const title =
      file.originalname.replace(/\.[^.]+$/, "").trim() ||
      "Untitled document";

    const document = await prisma.document.create({
      data: {
        title: title.slice(0, 120),
        content: safeHtml,
        sourceFileName: file.originalname,
        ownerId: res.locals.userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
        owner: { select: { name: true } },
      },
    });

    res.status(201).json({
      id: document.id,
      title: document.title,
      content: document.content,
      updatedAt: document.updatedAt,
      ownerName: document.owner.name,
      role: "owner",
    });
  } catch (error) {
    next(error);
  }
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}
