import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" } // allow all origins for dev
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (msg) => {
    socket.broadcast.emit("receive_message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", isTyping);
  });

});

server.listen(4000, () => console.log("Server running on 4000"));
