
import express from "express";

import AuthRouter from "../routes/auth.route";
import UserRouter from "../routes/user.route";
import DocumentRouter from "../routes/document.route";
import { errorHandler } from "../middleware/errorHandler.middleware";

const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Google Docs Clone API is running" });
});

app.use("/api/auth", AuthRouter);
app.use("/api/users", UserRouter);
app.use("/api/documents", DocumentRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
