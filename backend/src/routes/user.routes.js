const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getProfile } = require("../controllers/user.controller");

const userRouter = Router();

userRouter.get("/profile", authMiddleware, getProfile);

module.exports = userRouter;
