require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chat-frontendd.netlify.app/", // Replace with deployed frontend later
    methods: ["GET", "POST"],
  },
});

// Track connected users: socketId -> username
const users = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Listen for username registration
  socket.on("register_user", (username) => {
    users.set(socket.id, username);
    io.emit("user_joined", username);
    io.emit("active_users", Array.from(users.values()));
  });

  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });

  socket.on("typing", (username) => {
    console.log(`🟡 ${username} is typing...`);
    socket.broadcast.emit("user_typing", username);
  });

  socket.on("stop_typing", (username) => {
    console.log(`🟠 ${username} stopped typing`);
    socket.broadcast.emit("user_stop_typing", username);
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    if (username) {
      io.emit("user_left", username);
      io.emit("active_users", Array.from(users.values()));
    }
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("✅ Chat server running on http://localhost:3001");
});
