const fs = require("fs");
const logFile = "connections.log";
const Stream = require("./models/streamModel");
const Comment = require("./models/commentModel");

let activePeers = [];
const onlineUsers = new Map();
global.onlineUsers = onlineUsers;
const activeStreamers = new Set();

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
        io.to(sendUserSocket).emit("msg-recieve", data.msg);
      }
    });

    socket.on("register-peer", (peerInfo) => {
      if (!activePeers.some((p) => p.id === socket.id)) {
        const { ip, port } = peerInfo;
        activePeers.push({ id: socket.id, ip, port });
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
      const { channelId, username } = data;
      if (!username || username === "Guest") {
        socket.emit("error", { message: "Authentication required to start streaming" });
        return;
      }
      socket.username = username;
      socket.isVisitor = false;
      const streamer = { id: socket.id, username };
      activeStreamers.add(streamer);
      const newStream = new Stream({
        streamerId: socket.id,
        startTime: new Date(),
        channelId: channelId || "default",
      });
      await newStream.save();
      io.emit("streamers-update", Array.from(activeStreamers));
      fs.appendFileSync(logFile, `${new Date()} - Stream started by ${socket.id} (${username})\n`);
    });

    socket.on("stop-stream", () => {
      const streamer = Array.from(activeStreamers).find((s) => s.id === socket.id);
      if (streamer) {
        activeStreamers.delete(streamer);
      }
      io.emit("streamers-update", Array.from(activeStreamers));
      fs.appendFileSync(logFile, `${new Date()} - Stream stopped by ${socket.id}\n`);
    });

    socket.emit("streamers-update", Array.from(activeStreamers));

    socket.on("get-streamers", () => {
      socket.emit("streamers-update", Array.from(activeStreamers));
    });

    socket.on("request-offer", ({ streamerId }) => {
      const streamer = Array.from(activeStreamers).find((s) => s.id === streamerId);
      if (streamer) {
        socket.join(`stream_${streamerId}`);
        io.to(streamerId).emit("request-offer", { viewerId: socket.id });
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

    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
        }
      }
      activePeers = activePeers.filter((peer) => peer.id !== socket.id);
      const streamer = Array.from(activeStreamers).find((s) => s.id === socket.id);
      if (streamer) {
        activeStreamers.delete(streamer);
      }
      io.emit("streamers-update", Array.from(activeStreamers));
      fs.appendFileSync(logFile, `${new Date()} - Peer disconnected: ${socket.id}\n`);
    });
  });
};
