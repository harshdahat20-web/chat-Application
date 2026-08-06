const { Server } = require("socket.io");

const onlineUsers = {};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;

    if (userId) {
      onlineUsers[userId] = socket.id;
      io.emit("onlineUsers", Object.keys(onlineUsers));
    }
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => {
      if (userId) {
        delete onlineUsers[userId];
        io.emit("onlineUsers", Object.keys(onlineUsers));
      }
      console.log("User disconnected:", socket.id);
    });
  });
  return io;
};

const getReceiverSocketId = () => {
  return onlineUsers[userId];
};
module.exports = { initializeSocket, getReceiverSocketId };
