const fs = require("fs");
const logFile = "connections.log";
const Stream = require("./models/streamModel");
const Comment = require("./models/commentModel");

let activePeers = [];
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;
const activeStreamers = new Map(); // Changed from Set to Map
const pendingStreams = new Set(); // Track sockets that are starting a stream

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);
    fs.appendFileSync(logFile, `${new Date()} - Peer connected: ${socket.id}\n`);

    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        console.log(
          `Sending message from ${socket.id} to ${sendUserSocket} (user: ${data.to})`
        );
        io.to(sendUserSocket).emit("msg-recieve", {
          text: data.msg?.text,
          fileUrl: data.msg?.fileUrl,
          fileName: data.msg?.fileName,
          fileType: data.msg?.fileType,
        });
      } else {
        console.log(`User ${data.to} offline.`);
      }
    });

    socket.on("register-peer", (peerInfo) => {
      if (!activePeers.some((p) => p.id === socket.id)) {
        const { ip, port } = peerInfo;
        activePeers.push({ id: socket.id, ip, port });
        console.log(`Peer registered: ${ip}:${port} (ID: ${socket.id})`);
        console.log("Active peers:", activePeers);
        socket.emit("registration-success", activePeers);
      }
    });

    socket.on("register-visitor", ({ nickname }) => {
      socket.username = nickname || `Visitor_${socket.id}`;
      socket.userId = null;
      socket.isVisitor = true;
    });

    socket.on("get-peer-list", () => {
      const peerList = activePeers.filter((peer) => peer.id !== socket.id);
      socket.emit("peer-list", peerList);
    });

    socket.on("start-stream", async (data) => {
      console.log("Received start-stream:", data);
      const { channelId, username } = data;
      if (!username || username === "Guest") {
        console.log(`Authentication failed for ${socket.id}: Invalid username`);
        socket.emit("error", { message: "Authentication required to start streaming" });
        return;
      }
      socket.username = username;
      socket.isVisitor = false;
      pendingStreams.add(socket.id); // Mark this socket as starting a stream
      const streamer = { id: socket.id, username, channelId: channelId || "default" };
      activeStreamers.set(socket.id, streamer); // Use Map to store streamers
      console.log("Active streamers after start:", Array.from(activeStreamers.values()));
      io.emit("streamers-update", Array.from(activeStreamers.values()));
      // Save to database after emitting streamers-update
      try {
        const newStream = new Stream({
          streamerId: socket.id,
          startTime: new Date(),
          channelId: channelId || "default",
        });
        await newStream.save();
        fs.appendFileSync(logFile, `${new Date()} - Stream started by ${socket.id} (${username})\n`);
      } catch (error) {
        console.error(`Failed to save stream for ${socket.id}:`, error);
      } finally {
        pendingStreams.delete(socket.id); // Clear the pending flag
      }
    });

    socket.on("stop-stream", async () => {
      console.log(`Stop-stream received from ${socket.id}`);
      if (activeStreamers.has(socket.id)) {
        activeStreamers.delete(socket.id);
      } else {
        console.log(`Streamer ${socket.id} not found in activeStreamers`);
      }
      console.log("Active streamers after stop:", Array.from(activeStreamers.values()));
      io.emit("streamers-update", Array.from(activeStreamers.values()));
      fs.appendFileSync(logFile, `${new Date()} - Stream stopped by ${socket.id}\n`);
    });

    socket.emit("streamers-update", Array.from(activeStreamers.values()));

    socket.on("get-streamers", () => {
      socket.emit("streamers-update", Array.from(activeStreamers.values()));
    });

    socket.on("request-offer", ({ streamerId }) => {
      const streamer = activeStreamers.get(streamerId);
      if (streamer) {
        socket.join(`stream_${streamerId}`);
        io.to(streamerId).emit("request-offer", { from: socket.id });
        fs.appendFileSync(
          logFile,
          `${new Date()} - Viewer ${socket.id} requested offer from ${streamerId}\n`
        );
      } else {
        console.log(`Streamer ${streamerId} not found for viewer ${socket.id}`);
        socket.emit("error", { message: "Streamer not found" });
      }
    });

    socket.on("offer", ({ offer, to }) => {
      io.to(to).emit("offer", { offer, from: socket.id });
      fs.appendFileSync(logFile, `${new Date()} - Offer sent from ${socket.id} to ${to}\n`);
    });

    socket.on("answer", ({ answer, to }) => {
      io.to(to).emit("answer", { answer, from: socket.id });
      fs.appendFileSync(logFile, `${new Date()} - Answer sent from ${socket.id} to ${to}\n`);
    });

    socket.on("send-comment", async ({ comment, streamerId, username }) => {
      if (!username || username === "Guest") {
        console.log(`Blocked comment from unauthenticated user: ${socket.id}`);
        socket.emit("error", { message: "Authentication required to comment" });
        return;
      }
      socket.username = username;
      socket.isVisitor = false;
      const from = socket.id;
      const newComment = new Comment({
        streamerId,
        channelId: "main",
        username,
        comment,
      });
      await newComment.save();
      io.to(`stream_${streamerId}`).emit("receive-comment", {
        comment,
        from,
        username,
      });
      socket.emit("receive-comment", {
        comment,
        from,
        username,
      });
      fs.appendFileSync(
        logFile,
        `${new Date()} - Comment by ${username} on stream ${streamerId}: ${comment}\n`
      );
    });

    socket.on("get-comments", async ({ streamerId }) => {
      const comments = await Comment.find({ streamerId })
        .sort({ timestamp: -1 })
        .limit(50);
      socket.emit("comments-history", comments);
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
      fs.appendFileSync(logFile, `${new Date()} - ICE candidate sent from ${socket.id} to ${to}\n`);
    });

    socket.on("get-stream-history", async () => {
      const streams = await Stream.find({}).sort({ startTime: -1 }).limit(10);
      socket.emit("stream-history", streams);
    });

    socket.on("disconnect", async () => {
      console.log(`Disconnecting socket: ${socket.id}`);

      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }

      activePeers = activePeers.filter((peer) => peer.id !== socket.id);
      if (!pendingStreams.has(socket.id) && activeStreamers.has(socket.id)) {
        activeStreamers.delete(socket.id);
      }
      console.log("Active streamers after disconnect:", Array.from(activeStreamers.values()));
      io.emit("streamers-update", Array.from(activeStreamers.values()));
      fs.appendFileSync(logFile, `${new Date()} - Peer disconnected: ${socket.id}\n`);
    });
  });

  io.on("connection", (socket) => {
    socket.on("join-channel", (channelId) => {
      socket.join(channelId);
    });

    socket.on("send-channel-message", (data) => {
      const { channelId, senderId, message } = data;
      socket.to(channelId).emit("channel-message", {
        senderId,
        message,
      });
    });
  });
};