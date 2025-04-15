const fs = require("fs");
const logFile = "connections.log";
const Stream = require("./models/streamModel");

let activePeers = [];

const onlineUsers = new Map();
const activeStreamers = new Set();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);
    fs.appendFileSync(
      logFile,
      `${new Date()} - Peer connected: ${socket.id}\n`
    );

    // Chat functionality
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("Online users:", Array.from(onlineUsers.entries())); // Optional: log for debugging
    });

    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        console.log(
          `Sending message from ${socket.id} to ${sendUserSocket} (user: ${data.to})`
        ); // Debug log
        io.to(sendUserSocket).emit("msg-recieve", data.msg);
      } else {
        console.log(`User ${data.to} offline.`); // Debug log
      }
    });

    // Peer management for live streaming
    socket.on("register-peer", (peerInfo) => {
      // Simple check to avoid duplicates if needed
      if (!activePeers.some((p) => p.id === socket.id)) {
        const { ip, port } = peerInfo;
        activePeers.push({ id: socket.id, ip, port });
        console.log(`Peer registered: ${ip}:${port} (ID: ${socket.id})`);
        console.log("Active peers:", activePeers); // Debug log
        socket.emit("registration-success", activePeers); // Send current list back
      }
    });

    socket.on("get-peer-list", () => {
      // Send back all peers except the one asking
      const peerList = activePeers.filter((peer) => peer.id !== socket.id);
      socket.emit("peer-list", peerList);
    });

    // Streamer management
    socket.on("start-stream", (data) => {
      const { channelId } = data;
      const newStream = new Stream({
        streamerId: socket.id,
        startTime: new Date(),
        channelId: channelId || "default",
      });
      newStream.save();
      activeStreamers.add(socket.id);
      io.emit("streamers-update", Array.from(activeStreamers));
      console.log(`Stream started by ${socket.id}`);
      fs.appendFileSync(
        logFile,
        `${new Date()} - Stream started by ${socket.id}\n`
      );
    });

    socket.on("stop-stream", () => {
      activeStreamers.delete(socket.id);
      io.emit("streamers-update", Array.from(activeStreamers));
      console.log(`Stream stopped by ${socket.id}`);
      fs.appendFileSync(
        logFile,
        `${new Date()} - Stream stopped by ${socket.id}\n`
      );
    });

    // Targeted WebRTC signaling
    socket.on("request-offer", ({ streamerId }) => {
      if (activeStreamers.has(streamerId)) {
        io.to(streamerId).emit("request-offer", { viewerId: socket.id });
        fs.appendFileSync(
          logFile,
          `${new Date()} - Viewer ${
            socket.id
          } requested offer from ${streamerId}\n`
        );
      }
    });

    // WebRTC signaling for live streaming
    socket.on("offer", (offer) => {
      io.to(targetId).emit("offer", { offer, from: socket.id });
      fs.appendFileSync(
        logFile,
        `${new Date()} - Offer sent from ${socket.id} to ${targetId}\n`
      );
    });

    socket.on("answer", (answer) => {
      io.to(targetId).emit("answer", { answer, from: socket.id });
      fs.appendFileSync(
        logFile,
        `${new Date()} - Answer sent from ${socket.id} to ${targetId}\n`
      );
    });

    socket.on("ice-candidate", (candidate) => {
      io.to(targetId).emit("ice-candidate", { candidate, from: socket.id });
      fs.appendFileSync(
        logFile,
        `${new Date()} - ICE candidate sent from ${socket.id} to ${targetId}\n`
      );
    });

    socket.on("disconnect", () => {
      console.log(`User/Peer disconnected: ${socket.id}`);
      fs.appendFileSync(
        logFile,
        `${new Date()} - Peer disconnected: ${socket.id}\n`
      );

      // Remove user from onlineUsers map
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`Removed user ${userId} from online list.`);
          break;
        }
      }

      // Remove from activePeers
      activePeers = activePeers.filter((peer) => peer.id !== socket.id);
      activeStreamers.delete(socket.id);
      io.emit("streamers-update", Array.from(activeStreamers));
    });
  });
};
