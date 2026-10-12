
import type { RequestHandler } from "express";
import { documentService } from "../services/document.service";

export const listDocuments: RequestHandler = async (
  _req, res, next,
) => {
  try {
    res.json(
      await documentService.list(res.locals.userId),
    );
  } catch (error) {
    next(error);
  }
};

export const getDocument: RequestHandler = async (
  req, res, next,
) => {
  try {
    res.json(
      await documentService.get(
        req.params.id as string,
        res.locals.userId,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const createDocument: RequestHandler = async (
  req, res, next,
) => {
  try {
    const document = await documentService.create(
      res.locals.userId,
      req.body.title,
    );

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

export const updateDocument: RequestHandler = async (
  req, res, next,
) => {
  try {
    res.json(
      await documentService.update(
        req.params.id as string,
        res.locals.userId,
        req.body,
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteDocument: RequestHandler = async (
  req, res, next,
) => {
  try {
    await documentService.remove(
      req.params.id as string,
      res.locals.userId,
    );

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
