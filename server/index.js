const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
const setupSocket = require('./socket');
const http = require('http');
const channelRoutes = require("./routes/channel");
const path = require("path");

require("dotenv").config();

// app.use(cors());
//đổi thành địa chỉ IP của máy chủ
app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.1.6:3000"],
  credentials: true,
}));
app.use(express.json());

// Các routes
app.use("/api/channels", channelRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channel", channelRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Kết nối MongoDB
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

// Route test
app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

const server = http.createServer(app);

// Cấu hình socket.io
const io = socket(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.6:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // Wait 60 seconds before disconnecting
  pingInterval: 25000, // Check every 25 seconds
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

setupSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});