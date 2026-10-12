
import { Router } from "express";
import { listUsers } from "../controllers/user.controller";

const UserRouter = Router();

UserRouter.get("/", listUsers);

export default UserRouter;
