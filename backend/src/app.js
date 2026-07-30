const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// All API here
app.use("/api/v1/auth", authRouter);

module.exports = app;
