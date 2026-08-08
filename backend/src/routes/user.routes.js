const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getProfile, getAllUsers } = require("../controllers/user.controller");

const userRouter = Router();

userRouter.get("/profile", authMiddleware, getProfile);
userRouter.get("/all", authMiddleware, getAllUsers);

module.exports = userRouter;
