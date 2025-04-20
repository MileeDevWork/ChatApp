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

const PORT = process.env.PORT; 
server.listen(PORT, () => {
  console.log('Server running on port 5001');
});
