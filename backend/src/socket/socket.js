const { Server } = require("socket.io");

const onlineUsers = {};

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
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
      if (userId && onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];

        io.emit("onlineUsers", Object.keys(onlineUsers));
      }

      console.log("User disconnected:", socket.id);
    });
  });
  return io;
};

const getReceiverSocketId = (userId) => {
  return onlineUsers[userId];
};

const getIO = () => {
  return io;
};

module.exports = { initializeSocket, getReceiverSocketId, getIO };
