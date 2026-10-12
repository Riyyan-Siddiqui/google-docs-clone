
import { Router } from "express";
import { login } from "../controllers/auth.controller";

const AuthRouter = Router();

AuthRouter.post("/login", login);

export default AuthRouter;
