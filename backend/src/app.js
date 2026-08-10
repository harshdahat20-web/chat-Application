const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const conversationRouter = require("./routes/conversation.routes");
const messageRouter = require("./routes/message.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Health check route (for cron-job.org keep-alive ping)
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// All API here
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/conversation", conversationRouter);
app.use("/api/v1/message", messageRouter);

module.exports = app;
