const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getProfile,
  getAllUsers,
  updateProfile,
} = require("../controllers/user.controller");

const userRouter = Router();

userRouter.get("/profile", authMiddleware, getProfile);
userRouter.get("/all", authMiddleware, getAllUsers);
userRouter.put("/profile", authMiddleware, updateProfile);

module.exports = userRouter;
