
import { Router } from "express";
import { requireUser } from "../middleware/auth";
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller";
import {
  listShares,
  addShare,
  removeShare,
} from "../controllers/share.controller";

import {
  upload,
  importDocument,
} from "../controllers/import.controller";


const DocumentRouter = Router();
DocumentRouter.post("/import", upload.single("file"), importDocument);

DocumentRouter.get("/:id/shares", listShares);
DocumentRouter.post("/:id/shares", addShare);
DocumentRouter.delete("/:id/shares/:userId", removeShare);

DocumentRouter.use(requireUser);

DocumentRouter.get("/", listDocuments);
DocumentRouter.post("/", createDocument);

DocumentRouter.get("/:id", getDocument);
DocumentRouter.patch("/:id", updateDocument);
DocumentRouter.delete("/:id", deleteDocument);

export default DocumentRouter;
