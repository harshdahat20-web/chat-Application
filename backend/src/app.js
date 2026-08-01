const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// All API here
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);

module.exports = app;
