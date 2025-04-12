const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
const setupSocket = require('./socket');
const http = require('http');
// const server = http.createServer(app); 

require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

setupSocket(io);

const PORT = process.env.PORT; // Default to 3001 if PORT is not set
server.listen(PORT, () => {
  console.log('Server running on port 3000');
});


// // chat users
// global.onlineUsers = new Map();
// // live streaming peers
// global.activePeers = [];

// io.on("connection", (socket) => {
//   global.chatSocket = socket;

//   socket.on("add-user", (userId) => {
//     onlineUsers.set(userId, socket.id);
//   });

//   socket.on("send-msg", (data) => {
//     const sendUserSocket = onlineUsers.get(data.to);
//     if (sendUserSocket) {
//       socket.to(sendUserSocket).emit("msg-recieve", data.msg);
//     }
//   });

//   socket.on("register-peer", (peerInfo) => {
//     const { ip, port } = peerInfo;
//     activePeers.push({ id: socket.id, ip, port });
//     console.log(`Peer registered: ${ip}:${port}`);
//     socket.emit("registration-success", activePeers);
//   });

//   socket.on("disconnect", () => {
//     activePeers = activePeers.filter((peer) => peer.id !== socket.id);
//     console.log(`Peer disconnected: ${socket.id}`);
//   });

//   socket.on("get-peer-list", () => {
//     const peerList = activePeers.filter((peer) => peer.id !== socket.id);
//     socket.emit("peer-list", peerList);
//   });
// });
