require("dotenv").config();

const http = require("http");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = require("./src/app");
const connectDB = require("./src/db/db");

connectDB();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
